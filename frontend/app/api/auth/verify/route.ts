import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * JWT verification endpoint for cross-subdomain auth.
 * Used by Caddy's forward_auth to validate session cookies
 * before proxying requests to Grafana and other services.
 *
 * Returns 200 with X-Auth-User and X-Auth-Role headers if valid.
 * Returns 401 if no valid session.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      // No valid session — redirect to login with return URL
      const originalUrl = request.headers.get('x-forwarded-uri') || '/';
      const originalHost = request.headers.get('x-forwarded-host') || 'hyfern.us';
      const redirectUrl = `https://hyfern.us/login?redirect=https://${originalHost}${originalUrl}`;

      return new NextResponse(null, {
        status: 401,
        headers: {
          'Location': redirectUrl,
        },
      });
    }

    // Valid session — return auth headers for downstream services
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('X-Auth-User', session.user.username || session.user.id);
    response.headers.set('X-Auth-Role', session.user.role || 'VIEWER');
    return response;
  } catch (error) {
    console.error('Auth verify error:', error);
    return new NextResponse(null, { status: 401 });
  }
}
