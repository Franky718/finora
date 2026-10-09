import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieUpdate = { name: string; value: string; options?: any };

const protectedRoots = ["/dashboard", "/accounts", "/transactions", "/goals", "/reset-password"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoots.some((root) => pathname === root || pathname.startsWith(root + "/"));
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    if (isProtected) return NextResponse.redirect(new URL("/login?error=configuration", request.url));
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const cookieUpdates: CookieUpdate[] = [];
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          cookieUpdates.push({ name, value, options });
        });
        response = NextResponse.next({ request });
        cookieUpdates.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const copyCookies = (target: NextResponse) => {
    cookieUpdates.forEach(({ name, value, options }) => target.cookies.set(name, value, options));
    return target;
  };

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return copyCookies(NextResponse.redirect(loginUrl));
  }

  if (isAuthPage && isAuthenticated) {
    return copyCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};