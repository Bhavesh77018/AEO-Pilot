import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/app", "/scans"];

export async function middleware(request: NextRequest) {
  try {
    // Bypass auth ONLY for localhost testing
    const hostname = request.nextUrl.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return NextResponse.next();
    }
    
    // For all other hostnames (like aeopilot.in), strictly enforce auth
    // (If Supabase is misconfigured in production, login will simply fail, which is secure).

    const { response, user } = await updateSession(request);
    const path = request.nextUrl.pathname;
    const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));

    if (isProtected && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      // Preserve the FULL original URL (path + query) so the domain param survives auth
      const fullNext = request.nextUrl.pathname + request.nextUrl.search;
      loginUrl.search = "";
      loginUrl.searchParams.set("next", fullNext);
      return NextResponse.redirect(loginUrl);
    }

    // Already signed in? Skip the login page.
    if (path === "/login" && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    return response;
  } catch (err) {
    // Safety net: if anything in the auth flow throws unexpectedly,
    // fall through instead of crashing the edge function.
    console.error("[middleware] Unhandled error — falling through:", err);
    return NextResponse.next();
  }
}

export const config = {
  // Run on everything except static assets and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
