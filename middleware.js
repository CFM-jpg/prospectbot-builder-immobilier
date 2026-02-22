// middleware.js
// Protège les routes /immobilier et /b2b — redirige vers /login si pas connecté

import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'prospectbot_session';

// Routes qui nécessitent une authentification
const PROTECTED_PATHS = ['/immobilier', '/b2b'];
// Routes accessibles uniquement si non connecté
const AUTH_PATHS = ['/login'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));

  // Pas de session sur une route protégée → login
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session active sur la page de login → accueil
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/immobilier/:path*', '/b2b/:path*', '/login'],
};
