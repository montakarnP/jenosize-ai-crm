import { cookies } from "next/headers";
import { apiData, apiError, isRecord, readJson } from "@/lib/api";
import { sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import { signIn } from "@/lib/sign-in";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!isRecord(body) || typeof body.email !== "string" || typeof body.password !== "string") {
    return apiError("invalid", "Send email and password as JSON.", 400);
  }

  const result = await signIn(body.email, body.password);
  if (!result.ok) {
    if (result.code === "config") return apiError("config", "Session secret is not configured.", 500);
    return apiError("invalid", "That email or password does not match a demo user.", 401);
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, result.user.token, sessionCookieOptions());
  return apiData({
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
    title: result.user.title,
  });
}
