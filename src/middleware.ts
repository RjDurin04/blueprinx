import { NextResponse, type NextRequest } from 'next/server';
import { betterFetch } from '@better-fetch/fetch';
import type { Session } from 'better-auth/types';

interface SessionResponse {
    session: Session;
    user: { id: string; email: string; name: string;[key: string]: unknown };
}

// Routes that require an auth check (session fetch).
// All other routes pass through without hitting the auth endpoint.
const PROTECTED_PATHS = ['/dashboard', '/blueprint'];
const AUTH_REQUIRED_PATHS = [...PROTECTED_PATHS, '/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Fast path: skip session check for routes that don't need auth ──
    const needsAuth = AUTH_REQUIRED_PATHS.some((path) => pathname.startsWith(path));
    if (!needsAuth) {
        return NextResponse.next();
    }

    // ── Fetch session only when required ──
    let user = null;
    try {
        const { data: sessionData } = await betterFetch<SessionResponse>(
            '/api/auth/get-session',
            {
                baseURL: request.nextUrl.origin,
                headers: {
                    cookie: request.headers.get('cookie') || '',
                },
            }
        );
        user = sessionData?.user || null;
    } catch {
        // Auth service unavailable — treat as unauthenticated silently.
    }

    // ── Redirect unauthenticated users away from protected routes ──
    const isProtectedRoute = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
    if (!user && isProtectedRoute) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ── Redirect authenticated users away from /login ──
    if (user && pathname === '/login') {
        const redirectTo = request.nextUrl.searchParams.get('redirect') || '/';
        const url = request.nextUrl.clone();
        url.pathname = redirectTo;
        url.searchParams.delete('redirect');
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         * - api/ (don't intercept API endpoints — they handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
