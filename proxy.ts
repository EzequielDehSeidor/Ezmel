import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isMockMode } from "@/lib/supabase/env";
import { decodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";

const PUBLIC_PATHS = ["/login", "/logo.png", "/logo-white.png", "/logo-tagline.png", "/logo-tagline-white.png", "/prestamos.jpg"];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

/** Sin sesión: las páginas redirigen al login y las APIs responden 401 (no HTML). */
function unauthenticated(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Tu sesión venció. Volvé a iniciar sesión." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

/**
 * Primer filtro: exige estar autenticado y refresca la sesión de Supabase. Es sólo una
 * barrera "optimista": el tenant y el rol se verifican en cada página y en cada API
 * (lib/auth/guards.ts) y, por último, en la base de datos con RLS.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isMockMode()) {
    const session = decodeMockSession(request.cookies.get(MOCK_COOKIE_NAME)?.value);
    return session ? NextResponse.next() : unauthenticated(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() valida el token contra Supabase (no confía sólo en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated(request);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
