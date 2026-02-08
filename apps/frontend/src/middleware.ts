import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper function to check if user is authenticated
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('auth_token')?.value
  return !!token
}

// Helper function to get user role from cookies
function getUserRole(request: NextRequest): 'client' | 'admin' | null {
  const role = request.cookies.get('user_role')?.value
  return (role === 'client' || role === 'admin') ? role : null
}

// Route definitions
const publicRoutes = ['/', '/login', '/register', '/catalog', '/checkout']
const clientRoutes = ['/dashboard', '/servers', '/orders', '/billing', '/support', '/profile']
const adminRoutes = ['/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticatedUser = isAuthenticated(request)
  const userRole = getUserRole(request)

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isClientRoute = clientRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Redirect authenticated users away from auth pages
  if (isAuthenticatedUser && (pathname === '/login' || pathname === '/register')) {
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/dashboard'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Protect client routes
  if (isClientRoute && !isAuthenticatedUser) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect admin routes
  if (isAdminRoute && !isAuthenticatedUser) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect admin routes - only admins can access
  if (isAdminRoute && isAuthenticatedUser && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow access to public routes
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
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
