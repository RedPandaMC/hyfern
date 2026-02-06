import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getWingsClient } from '@/lib/wings';
import { Role } from '@/app/generated/prisma';

/**
 * WebSocket console proxy route
 * Accepts GET requests and upgrades to WebSocket
 * Forwards messages between client and Wings console WebSocket
 * Protected route - requires MODERATOR+ role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and require MODERATOR role or higher
    const session = await auth();
    requireRole(session, Role.MODERATOR);

    // Check if request is a WebSocket upgrade request
    const upgradeHeader = request.headers.get('upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    // Get WebSocket credentials from Wings API
    const wingsClient = getWingsClient();
    const { token, socket } = await wingsClient.getWebSocketCredentials();

    // Create WebSocket connection to Wings
    const wingsUrl = `${socket}?token=${token}`;

    // Note: Next.js Edge Runtime doesn't support WebSocket server directly
    // We need to use a different approach for WebSocket proxying

    // Return WebSocket connection details for client to connect directly
    return new Response(
      JSON.stringify({
        success: true,
        socket: wingsUrl,
        message: 'WebSocket connection details retrieved',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Failed to establish console connection:', error);

    // Handle permission errors
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return new Response(
        JSON.stringify({
          error: 'FORBIDDEN',
          message: error.message,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          error: 'UNAUTHORIZED',
          message: error.message,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
