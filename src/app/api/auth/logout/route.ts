import { cookies } from "next/headers";
import { apiData } from "@/lib/api";
import { sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return apiData({ signedOut: true });
}
