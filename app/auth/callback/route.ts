import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieUpdate = { name: string; value: string; options?: Record<string, unknown> };

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const safeNext =
    requestedNext &&
    /^\/(?:[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)?$/.test(requestedNext) &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";
  const isPasswordRecovery = safeNext === "/reset-password";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  }

  // Keep every cookie issued while exchanging/verifying the recovery token.
  // Attach them to the redirect response itself, so the next page receives the
  // recovery session even when the response is a redirect.
  const cookieUpdates: CookieUpdate[] = [];
  const cacheHeaders = new Headers();
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          cookieUpdates.push({ name, value, options });
        });
        Object.entries(headers ?? {}).forEach(([name, value]) => {
          cacheHeaders.set(name, value);
        });
      }
    }
  });

  const redirectWithAuthCookies = (destination: URL) => {
    const response = NextResponse.redirect(destination);
    cookieUpdates.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as any);
    });
    cacheHeaders.forEach((value, name) => response.headers.set(name, value));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };

  // Handle direct token-hash links when the email template is configured to
  // send the token to this route instead of using the PKCE code flow.
  if (tokenHash && type === "recovery" && isPasswordRecovery) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery"
    });

    if (!error) {
      return redirectWithAuthCookies(new URL(safeNext, request.url));
    }
  }

  // The standard Supabase email link redirects here with a PKCE authorization
  // code. Exchanging it creates the session needed by updateUser({ password }).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectWithAuthCookies(new URL(safeNext, request.url));
    }
  }

  if (isPasswordRecovery) {
    return redirectWithAuthCookies(
      new URL("/reset-password?recovery=invalid", request.url)
    );
  }

  return redirectWithAuthCookies(new URL("/login?error=auth_callback", request.url));
}
