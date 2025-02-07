import { NextRequest } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { ModelPullRequest } from "lib/types/api/model-pull.request";

const orgMembershipService = new OrgMembershipService();

export async function POST(
  req: NextRequest,
  { params }: { params: { orgIdOrSlug: string } },
) {
  const [authenticated, authUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permissions
  const hasPermissions = await orgMembershipService.hasAdminPermission(
    authUserId!,
    params.orgIdOrSlug,
  );
  if (!hasPermissions) {
    return NextResponseErrors.forbidden();
  }

  const modelPullRequest = (await req.json()) as ModelPullRequest;

  const ollamaResponse = await fetch(
    `${
      process.env.INFERENCE_SERVER +
      (process.env.INFERENCE_SERVER?.endsWith("/") ? "" : "/")
    }api/pull`,
    {
      method: "POST",
      body: JSON.stringify(modelPullRequest),
    },
  );

  return new Response(ollamaResponse.body);
}
