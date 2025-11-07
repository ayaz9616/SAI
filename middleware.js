import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const protectedPaths = ['/', '/add', '/help'];
  const isProtected = protectedPaths.includes(pathname);
  const token = req.cookies.get('token')?.value;
  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if ((pathname === '/login' || pathname === '/signup') && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/add', '/help', '/settings', '/login', '/signup'],
};
