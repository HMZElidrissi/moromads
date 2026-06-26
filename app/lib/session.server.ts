import { createCookieSessionStorage } from "react-router";

export function getCookieStorage(secret: string) {
  return createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [secret],
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  });
}

export async function getTokenFromRequest(
  request: Request,
  secret: string,
): Promise<string | null> {
  const { getSession } = getCookieStorage(secret);
  const session = await getSession(request.headers.get("Cookie"));
  return (session.get("token") as string | undefined) ?? null;
}

export async function createSessionCookie(token: string, secret: string): Promise<string> {
  const { getSession, commitSession } = getCookieStorage(secret);
  const session = await getSession();
  session.set("token", token);
  return commitSession(session);
}

export async function destroySessionCookie(request: Request, secret: string): Promise<string> {
  const { getSession, destroySession } = getCookieStorage(secret);
  const session = await getSession(request.headers.get("Cookie"));
  return destroySession(session);
}
