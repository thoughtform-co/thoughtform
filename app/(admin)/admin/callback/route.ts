import { NextRequest, NextResponse } from "next/server";

/**
 * Handle Supabase auth callback (magic link)
 *
 * Note: Supabase magic links use hash fragments (#access_token=...) which
 * are only available client-side. This route redirects to /admin where
 * the client-side code handles the authentication.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // Redirect to admin page - the client will handle hash fragments
  // Hash fragments are not sent to the server, so we can't process them here
  return NextResponse.redirect(new URL("/admin", requestUrl.origin));
}
