import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getDockerClient } from '@/lib/docker';
import { Role } from '@/app/generated/prisma';

interface ServerConfig {
  ServerName: string;
  MOTD: string;
  Password: string;
  MaxPlayers: number;
  MaxViewRadius: number;
  viewDistance?: number;
  PerformanceSaver?: { ViewDistance: number };
}

interface ConfigResponse {
  config: ServerConfig;
  restartRequired?: boolean;
}

const CONFIG_FILE_PATH = '/data/config.json';

const defaultConfig: ServerConfig = {
  ServerName: 'HyFern Server',
  MOTD: 'Welcome to HyFern!',
  MaxPlayers: 100,
  MaxViewRadius: 32,
  viewDistance: 16,
  Password: '',
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    requireRole(session, Role.ADMIN);

    const dockerClient = getDockerClient();
    const containerName = process.env.HYTALE_SERVER_CONTAINER || 'hyfern-hytale';
    
    const result = await dockerClient.execCommandInContainer(
      containerName,
      `cat ${CONFIG_FILE_PATH} 2>/dev/null || echo '{}'`
    );

    let config: ServerConfig;
    try {
      config = { ...defaultConfig, ...JSON.parse(result.output.replace(/'/g, '"')) };
    } catch {
      config = defaultConfig;
    }

    return NextResponse.json({ config } as ConfigResponse);
  } catch (error) {
    console.error('Failed to read config:', error);

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

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    requireRole(session, Role.ADMIN);

    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'INVALID_CONFIG', message: 'Config must be an object' }, { status: 400 });
    }

    const requiredFields = ['ServerName', 'MOTD', 'MaxPlayers', 'MaxViewRadius'];
    for (const field of requiredFields) {
      if (!(field in config)) {
        return NextResponse.json({ error: 'MISSING_FIELD', message: `Required field '${field}' is missing` }, { status: 400 });
      }
    }

    if (typeof config.ServerName !== 'string' || config.ServerName.length === 0) {
      return NextResponse.json({ error: 'INVALID_FIELD', message: 'ServerName must be a non-empty string' }, { status: 400 });
    }

    if (typeof config.MOTD !== 'string') {
      return NextResponse.json({ error: 'INVALID_FIELD', message: 'MOTD must be a string' }, { status: 400 });
    }

    if (typeof config.MaxPlayers !== 'number' || config.MaxPlayers < 1 || config.MaxPlayers > 100) {
      return NextResponse.json({ error: 'INVALID_FIELD', message: 'MaxPlayers must be a number between 1 and 100' }, { status: 400 });
    }

    if (typeof config.MaxViewRadius !== 'number' || config.MaxViewRadius < 6 || config.MaxViewRadius > 64) {
      return NextResponse.json({ error: 'INVALID_FIELD', message: 'MaxViewRadius must be a number between 6 and 64' }, { status: 400 });
    }

    const dockerClient = getDockerClient();
    const containerName = process.env.HYTALE_SERVER_CONTAINER || 'hyfern-hytale';
    
    const currentResult = await dockerClient.execCommandInContainer(
      containerName,
      `cat ${CONFIG_FILE_PATH} 2>/dev/null || echo '{}'`
    );

    let currentConfig: ServerConfig;
    try {
      currentConfig = { ...defaultConfig, ...JSON.parse(currentResult.output.replace(/'/g, '"')) };
    } catch {
      currentConfig = defaultConfig;
    }

    const updatedConfig: ServerConfig = {
      ...currentConfig,
      ...config,
    };

    const configJson = JSON.stringify(updatedConfig, null, 2);
    await dockerClient.execCommandInContainer(
      containerName,
      `mkdir -p /data && echo '${configJson.replace(/'/g, "'\\''")}' > ${CONFIG_FILE_PATH}`
    );

    return NextResponse.json({
      config: updatedConfig,
      restartRequired: true,
    } as ConfigResponse);
  } catch (error) {
    console.error('Failed to update config:', error);

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
