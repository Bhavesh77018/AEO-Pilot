import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/app", "/scans"];

export async function middleware(request: NextRequest) {
  try {
    // If Supabase isn't configured, run fully open (no auth gate).
    if (!isSupabaseConfigured) return NextResponse.next();

    const { response, user } = await updateSession(request);
    const path = request.nextUrl.pathname;
    const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
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
