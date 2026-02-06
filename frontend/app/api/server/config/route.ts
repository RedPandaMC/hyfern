import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getWingsClient } from '@/lib/wings';
import { Role } from '@/app/generated/prisma';

interface ServerConfig {
  ServerName: string;
  MOTD: string;
  Password: string;
  MaxPlayers: number;
  MaxViewRadius: number;
  PerformanceSaver?: {
    ViewDistance: number;
  };
}

interface ConfigResponse {
  config: ServerConfig;
  restartRequired?: boolean;
}

const CONFIG_FILE_PATH = '/config/config.json';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and require ADMIN role or higher
    const session = await auth();
    requireRole(session, Role.ADMIN);

    // Get Wings client
    const wingsClient = getWingsClient();

    // Read config.json file
    const configContent = await wingsClient.getFileContents(CONFIG_FILE_PATH);

    // Parse JSON
    const config: ServerConfig = JSON.parse(configContent);

    return NextResponse.json({
      config,
    } as ConfigResponse);
  } catch (error) {
    console.error('Failed to read config:', error);

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

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'INVALID_JSON',
          message: 'Config file contains invalid JSON',
        },
        { status: 500 }
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
    // Check authentication and require ADMIN role or higher
    const session = await auth();
    requireRole(session, Role.ADMIN);

    // Parse request body
    const body = await request.json();
    const { config } = body;

    // Validate config structure
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        {
          error: 'INVALID_CONFIG',
          message: 'Config must be an object',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['ServerName', 'MOTD', 'MaxPlayers', 'MaxViewRadius'];
    for (const field of requiredFields) {
      if (!(field in config)) {
        return NextResponse.json(
          {
            error: 'MISSING_FIELD',
            message: `Required field '${field}' is missing`,
          },
          { status: 400 }
        );
      }
    }

    // Validate field types and values
    if (typeof config.ServerName !== 'string' || config.ServerName.length === 0) {
      return NextResponse.json(
        {
          error: 'INVALID_FIELD',
          message: 'ServerName must be a non-empty string',
        },
        { status: 400 }
      );
    }

    if (typeof config.MOTD !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_FIELD',
          message: 'MOTD must be a string',
        },
        { status: 400 }
      );
    }

    if (typeof config.MaxPlayers !== 'number' || config.MaxPlayers < 1 || config.MaxPlayers > 100) {
      return NextResponse.json(
        {
          error: 'INVALID_FIELD',
          message: 'MaxPlayers must be a number between 1 and 100',
        },
        { status: 400 }
      );
    }

    if (typeof config.MaxViewRadius !== 'number' || config.MaxViewRadius < 6 || config.MaxViewRadius > 64) {
      return NextResponse.json(
        {
          error: 'INVALID_FIELD',
          message: 'MaxViewRadius must be a number between 6 and 64',
        },
        { status: 400 }
      );
    }

    // Get Wings client
    const wingsClient = getWingsClient();

    // Read current config first to preserve other fields
    let currentConfig: ServerConfig;
    try {
      const currentContent = await wingsClient.getFileContents(CONFIG_FILE_PATH);
      currentConfig = JSON.parse(currentContent);
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty config
      currentConfig = {} as ServerConfig;
    }

    // Merge new config with current config
    const updatedConfig = {
      ...currentConfig,
      ...config,
    };

    // Write updated config back to file
    const configJson = JSON.stringify(updatedConfig, null, 2);
    await wingsClient.writeFileContents(CONFIG_FILE_PATH, configJson);

    return NextResponse.json({
      config: updatedConfig,
      restartRequired: true,
    } as ConfigResponse);
  } catch (error) {
    console.error('Failed to update config:', error);

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
