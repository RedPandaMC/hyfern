import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getPrisma } from '@/lib/prisma';
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
    const session = await auth();
    requireRole(session, Role.OWNER);

    const prisma = getPrisma();
    const serverConfig = await prisma.serverConfig.findUnique({ where: { id: 1 } });

    if (!serverConfig) {
      const defaultConfig: Partial<JVMConfig> = {
        minMemory: 4096,
        maxMemory: 6144,
        gcType: 'G1GC',
        maxGCPause: 200,
      };
      return NextResponse.json({
        currentFlags: jvmConfigToFlags(defaultConfig as JVMConfig),
        config: defaultConfig,
      } as JVMResponse);
    }

    const config: JVMConfig = {
      minMemory: serverConfig.minMemory,
      maxMemory: serverConfig.maxMemory,
      gcType: serverConfig.gcType as 'G1GC' | 'ZGC',
      maxGCPause: serverConfig.maxGCPause,
      customFlags: serverConfig.customFlags || undefined,
    };

    const currentFlags = jvmConfigToFlags(config);

    return NextResponse.json({
      currentFlags,
      config,
    } as JVMResponse);
  } catch (error) {
    console.error('Failed to get JVM config:', error);

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
    requireRole(session, Role.OWNER);

    const body: JVMUpdateRequest = await request.json();
    let config: JVMConfig;

    if (body.preset) {
      if (!JVM_PRESETS[body.preset]) {
        return NextResponse.json({ error: 'INVALID_PRESET', message: `Invalid preset: ${body.preset}` }, { status: 400 });
      }
      config = JVM_PRESETS[body.preset].config;
    } else if (body.config) {
      config = body.config;
    } else {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: 'Either config or preset must be provided' }, { status: 400 });
    }

    if (typeof config.minMemory !== 'number' || config.minMemory < 1 || config.minMemory > 32) {
      return NextResponse.json({ error: 'INVALID_CONFIG', message: 'minMemory must be between 1 and 32 GB' }, { status: 400 });
    }

    if (typeof config.maxMemory !== 'number' || config.maxMemory < 1 || config.maxMemory > 32) {
      return NextResponse.json({ error: 'INVALID_CONFIG', message: 'maxMemory must be between 1 and 32 GB' }, { status: 400 });
    }

    if (config.minMemory > config.maxMemory) {
      return NextResponse.json({ error: 'INVALID_CONFIG', message: 'minMemory cannot be greater than maxMemory' }, { status: 400 });
    }

    if (!['G1GC', 'ZGC'].includes(config.gcType)) {
      return NextResponse.json({ error: 'INVALID_CONFIG', message: 'gcType must be either G1GC or ZGC' }, { status: 400 });
    }

    if (typeof config.maxGCPause !== 'number' || config.maxGCPause < 50 || config.maxGCPause > 1000) {
      return NextResponse.json({ error: 'INVALID_CONFIG', message: 'maxGCPause must be between 50 and 1000' }, { status: 400 });
    }

    const newFlags = jvmConfigToFlags(config);
    const currentFlags = newFlags;

    const prisma = getPrisma();
    await prisma.serverConfig.upsert({
      where: { id: 1 },
      update: {
        minMemory: config.minMemory,
        maxMemory: config.maxMemory,
        gcType: config.gcType,
        maxGCPause: config.maxGCPause,
        customFlags: config.customFlags,
      },
      create: {
        id: 1,
        minMemory: config.minMemory,
        maxMemory: config.maxMemory,
        gcType: config.gcType,
        maxGCPause: config.maxGCPause,
        customFlags: config.customFlags,
      },
    });

    return NextResponse.json({
      currentFlags,
      pendingFlags: newFlags,
      config,
      restartRequired: true,
    } as JVMResponse);
  } catch (error) {
    console.error('Failed to update JVM config:', error);

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
