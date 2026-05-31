import { NextResponse } from 'next/server';

const ROLE_PERMISSIONS = {
  admin:    ['/dashboard', '/dashboard/attendance', '/dashboard/expenses', '/dashboard/schedules', '/dashboard/employees', '/dashboard/notifications'],
  caissier: ['/dashboard', '/dashboard/attendance', '/dashboard/schedules', '/dashboard/notifications'],
  serveur:  ['/dashboard', '/dashboard/attendance', '/dashboard/schedules'],
  cuisine:  ['/dashboard', '/dashboard/attendance', '/dashboard/schedules'],
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const userRole    = request.cookies.get('user_role')?.value;

  if (pathname.startsWith('/dashboard')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const allowedRoutes = ROLE_PERMISSIONS[userRole] || [];
    const isAllowed = allowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (pathname === '/login' && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
