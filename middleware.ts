import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege el panel: sin sesión, redirige a /panel/login.
 * Si Supabase no está conectado, el panel funciona en modo demostración sin login.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = request.nextUrl.pathname.startsWith("/panel/login");
  if (!user && !isLogin) {
    const login = request.nextUrl.clone();
    login.pathname = "/panel/login";
    return NextResponse.redirect(login);
  }
  if (user && isLogin) {
    const panel = request.nextUrl.clone();
    panel.pathname = "/panel";
    return NextResponse.redirect(panel);
  }
  return response;
}

export const config = { matcher: ["/panel/:path*"] };
