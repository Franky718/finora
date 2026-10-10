import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();

  if (tokenHash && type === "recovery" && isPasswordRecovery) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery"
    });

    if (!error) {
      const response = NextResponse.redirect(new URL(safeNext, request.url));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const response = NextResponse.redirect(new URL(safeNext, request.url));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }

  if (isPasswordRecovery) {
    const response = NextResponse.redirect(new URL("/reset-password?recovery=invalid", request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", request.url));
}
