import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getDockerClient } from '@/lib/docker';
import { Role } from '@/app/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    requireRole(session, Role.MODERATOR);

    const upgradeHeader = request.headers.get('upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const dockerClient = getDockerClient();
    const status = await dockerClient.getContainerStatus();

    if (status.state !== 'running') {
      return new Response(
        JSON.stringify({ error: 'SERVER_NOT_RUNNING', message: 'Server is not running' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const logs = await dockerClient.getContainerLogs(100);

    return new Response(
      JSON.stringify({
        success: true,
        logs: logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n'),
        message: 'Log stream retrieved',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to get console logs:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return new Response(
        JSON.stringify({ error: 'FORBIDDEN', message: error.message }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
