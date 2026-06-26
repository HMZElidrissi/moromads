import type { Route } from "./+types/admin.logout";
import { redirect } from "react-router";
import { cloudflareContext } from "../../load-context";
import { getTokenFromRequest, destroySessionCookie } from "~/lib/session.server";
import { revokeSession } from "~/lib/auth.server";

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const token = await getTokenFromRequest(request, env.ADMIN_KEY);
  if (token) await revokeSession(env.DB, token);
  const cookie = await destroySessionCookie(request, env.ADMIN_KEY);
  return redirect("/admin", { headers: { "Set-Cookie": cookie } });
}

export async function loader() {
  return redirect("/admin");
}
