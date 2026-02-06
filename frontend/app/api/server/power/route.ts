import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getWingsClient } from '@/lib/wings';
import { Role } from '@/app/generated/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and require ADMIN role or higher
    const session = await auth();
    requireRole(session, Role.ADMIN);

    // Parse request body
    const body = await request.json();
    const { action } = body;

    // Validate action
    if (!action || !['start', 'stop', 'restart', 'kill'].includes(action)) {
      return NextResponse.json(
        {
          error: 'INVALID_ACTION',
          message: 'Action must be one of: start, stop, restart, kill',
        },
        { status: 400 }
      );
    }

    // Get Wings client
    const wingsClient = getWingsClient();

    // Send power action to Wings API
    let result;
    switch (action) {
      case 'start':
        result = await wingsClient.startServer();
        break;
      case 'stop':
        result = await wingsClient.stopServer();
        break;
      case 'restart':
        result = await wingsClient.restartServer();
        break;
      case 'kill':
        result = await wingsClient.killServer();
        break;
      default:
        return NextResponse.json(
          {
            error: 'INVALID_ACTION',
            message: 'Invalid action specified',
          },
          { status: 400 }
        );
    }

    // Return result
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to execute power action:', error);

    // Handle permission errors
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: error.message,
        },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: error.message,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
