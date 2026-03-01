import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getDockerClient } from '@/lib/docker';
import { Role } from '@/app/generated/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    requireRole(session, Role.ADMIN);

    const body = await request.json();
    const { action } = body;

    if (!action || !['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json(
        { error: 'INVALID_ACTION', message: 'Action must be one of: start, stop, restart' },
        { status: 400 }
      );
    }

    const dockerClient = getDockerClient();
    let result;

    switch (action) {
      case 'start':
        result = await dockerClient.startContainer();
        break;
      case 'stop':
        result = await dockerClient.stopContainer();
        break;
      case 'restart':
        result = await dockerClient.restartContainer();
        break;
      default:
        return NextResponse.json(
          { error: 'INVALID_ACTION', message: 'Invalid action specified' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        action,
        message: result.message,
        timestamp: Date.now(),
      });
    } else {
      return NextResponse.json({
        success: false,
        action,
        message: result.message,
        timestamp: Date.now(),
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to execute power action:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'FORBIDDEN', message: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    requireRole(session, Role.VIEWER);

    const dockerClient = getDockerClient();
    const status = await dockerClient.getContainerStatus();

    return NextResponse.json({
      state: status.state,
      status: status.status,
      uptime: status.uptime,
      memory: status.memory,
      cpu: status.cpu,
    });
  } catch (error) {
    console.error('Failed to get server status:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
