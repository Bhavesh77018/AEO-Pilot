import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

/**
 * Refreshes the Supabase auth cookie on every request and returns the response
 * plus the resolved user. Standard @supabase/ssr pattern.
 *
 * Returns { response: NextResponse.next(), user: null } if Supabase env vars
 * are not configured — prevents the edge function from crashing on Netlify
 * when the vars haven't been added to the dashboard yet.
 */
export async function updateSession(request: NextRequest) {
  // Guard: never call createServerClient with undefined credentials.
  // This is the primary crash cause on Netlify when env vars are missing.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { response: NextResponse.next({ request }), user: null };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
