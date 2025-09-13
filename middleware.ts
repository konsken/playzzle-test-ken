import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/profile', '/play', '/category', '/slide-puzzle', '/move-puzzle', '/account'];
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/terms-of-service', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('__session')?.value

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (!sessionCookie && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  if (sessionCookie && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
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
