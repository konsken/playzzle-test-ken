
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/account', '/puzzles', '/category', '/play', '/slide-puzzle', '/move-puzzle', '/dashboard'];
const SUPER_ADMIN_ROUTE = '/super-admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('__session')?.value

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isSuperAdminRoute = pathname.startsWith(SUPER_ADMIN_ROUTE);

  // If trying to access a protected or admin route without a session cookie, redirect to login
  if (!sessionCookie && (isProtectedRoute || isSuperAdminRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user has a session and tries to access login/signup, redirect to puzzles page
  if (sessionCookie && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/puzzles', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - puzzles (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|puzzles).*)',
  ],
}
