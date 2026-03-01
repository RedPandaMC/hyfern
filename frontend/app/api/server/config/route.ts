import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getDockerClient } from '@/lib/docker';
import { Role } from '@/app/generated/prisma';
import { promises as fs } from 'fs';
import path from 'path';

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

const CONFIG_FILE_PATH = process.env.HYTALE_CONFIG_PATH || '/data/hytale/config/config.json';

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

    let config: ServerConfig;
    try {
      const content = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
      config = { ...defaultConfig, ...JSON.parse(content) };
    } catch {
      config = defaultConfig;
      await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
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

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'INVALID_JSON', message: 'Config file contains invalid JSON' }, { status: 500 });
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

    let currentConfig: ServerConfig;
    try {
      const currentContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
      currentConfig = { ...defaultConfig, ...JSON.parse(currentContent) };
    } catch {
      currentConfig = defaultConfig;
    }

    const updatedConfig: ServerConfig = {
      ...currentConfig,
      ...config,
    };

    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(updatedConfig, null, 2));

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
