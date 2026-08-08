import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION, verifySessionToken } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next|robots.txt|favicon.ico|manifest.webmanifest|login|.*\\..*).*)"],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION.cookieName)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }
  const url = new URL("/login", req.url);
  const from = req.nextUrl.pathname + req.nextUrl.search;
  if (from.startsWith("/") && !from.startsWith("//")) {
    url.searchParams.set("from", from);
  }
  return NextResponse.redirect(url);
}
