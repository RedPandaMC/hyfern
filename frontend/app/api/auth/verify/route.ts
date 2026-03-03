import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * JWT verification endpoint for cross-service auth.
 * Used by Caddy's forward_auth to validate session cookies.
 *
 * Returns 200 with X-Auth-User and X-Auth-Role headers if valid.
 * Returns 401 if no valid session.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse(null, { status: 401 });
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
