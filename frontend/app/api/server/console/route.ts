import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getDockerClient } from '@/lib/docker';
import { Role } from '@/app/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    requireRole(session, Role.MODERATOR);

    const dockerClient = getDockerClient();
    const status = await dockerClient.getContainerStatus();

    if (status.state !== 'running') {
      return Response.json(
        { error: 'SERVER_NOT_RUNNING', message: 'Server is not running' },
        { status: 503 }
      );
    }

    const logs = await dockerClient.getContainerLogs(100);

    return Response.json({
      success: true,
      logs: logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n'),
      message: 'Log stream retrieved',
    });
  } catch (error) {
    console.error('Failed to get console logs:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return Response.json(
        { error: 'FORBIDDEN', message: error.message },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return Response.json(
        { error: 'UNAUTHORIZED', message: error.message },
        { status: 401 }
      );
    }

    return Response.json({
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
