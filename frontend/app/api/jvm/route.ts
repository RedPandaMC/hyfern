import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getPelicanClient } from '@/lib/pelican';
import { Role } from '@/app/generated/prisma';
import {
  JVMConfig,
  JVMPreset,
  JVM_PRESETS,
  jvmConfigToFlags,
  flagsToJvmConfig
} from '@/types/jvm';

interface JVMResponse {
  currentFlags: string;
  pendingFlags?: string;
  config: Partial<JVMConfig>;
  restartRequired?: boolean;
}

interface JVMUpdateRequest {
  config?: JVMConfig;
  preset?: JVMPreset;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and require OWNER role
    const session = await auth();
    requireRole(session, Role.OWNER);

    // Get Pelican client
    const pelicanClient = getPelicanClient();

    // Get current JVM flags from STARTUP variable
    const currentFlags = await pelicanClient.getJVMFlags();

    // Parse flags to config
    const config = flagsToJvmConfig(currentFlags);

    return NextResponse.json({
      currentFlags,
      config,
    } as JVMResponse);
  } catch (error) {
    console.error('Failed to get JVM config:', error);

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

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and require OWNER role
    const session = await auth();
    requireRole(session, Role.OWNER);

    // Parse request body
    const body: JVMUpdateRequest = await request.json();

    let config: JVMConfig;

    // Check if preset is being applied
    if (body.preset) {
      if (!JVM_PRESETS[body.preset]) {
        return NextResponse.json(
          {
            error: 'INVALID_PRESET',
            message: `Invalid preset: ${body.preset}`,
          },
          { status: 400 }
        );
      }
      config = JVM_PRESETS[body.preset].config;
    } else if (body.config) {
      config = body.config;
    } else {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Either config or preset must be provided',
        },
        { status: 400 }
      );
    }

    // Validate config
    if (typeof config.minMemory !== 'number' || config.minMemory < 1 || config.minMemory > 32) {
      return NextResponse.json(
        {
          error: 'INVALID_CONFIG',
          message: 'minMemory must be between 1 and 32 GB',
        },
        { status: 400 }
      );
    }

    if (typeof config.maxMemory !== 'number' || config.maxMemory < 1 || config.maxMemory > 32) {
      return NextResponse.json(
        {
          error: 'INVALID_CONFIG',
          message: 'maxMemory must be between 1 and 32 GB',
        },
        { status: 400 }
      );
    }

    if (config.minMemory > config.maxMemory) {
      return NextResponse.json(
        {
          error: 'INVALID_CONFIG',
          message: 'minMemory cannot be greater than maxMemory',
        },
        { status: 400 }
      );
    }

    if (!['G1GC', 'ZGC'].includes(config.gcType)) {
      return NextResponse.json(
        {
          error: 'INVALID_CONFIG',
          message: 'gcType must be either G1GC or ZGC',
        },
        { status: 400 }
      );
    }

    if (typeof config.maxGCPauseMillis !== 'number' || config.maxGCPauseMillis < 50 || config.maxGCPauseMillis > 1000) {
      return NextResponse.json(
        {
          error: 'INVALID_CONFIG',
          message: 'maxGCPauseMillis must be between 50 and 1000',
        },
        { status: 400 }
      );
    }

    // Convert config to JVM flags
    const newFlags = jvmConfigToFlags(config);

    // Get Pelican client
    const pelicanClient = getPelicanClient();

    // Get current flags for comparison
    const currentFlags = await pelicanClient.getJVMFlags();

    // Update JVM flags via Pelican API
    await pelicanClient.updateJVMFlags(newFlags);

    return NextResponse.json({
      currentFlags,
      pendingFlags: newFlags,
      config,
      restartRequired: true,
    } as JVMResponse);
  } catch (error) {
    console.error('Failed to update JVM config:', error);

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
