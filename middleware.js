// middleware.js
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'prospectbot_session';
const PROTECTED_PATHS = ['/immobilier', '/b2b'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  // Laisser passer / et /login sans vérification
  if (pathname === '/' || pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Routes protégées sans session → login
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/immobilier/:path*', '/b2b/:path*', '/login/:path*', '/login'],
};
