import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

const publicApi = new Set(["/api/auth/login", "/api/auth/logout", "/api/line/webhook"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (publicApi.has(pathname)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "Sign in required." } },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/login")) {
    if (session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
