// JVM configuration types and presets

export type GCType = 'G1GC' | 'ZGC';
export type JVMPreset = 'casual' | 'community' | 'performance' | 'ultra';

export interface JVMConfig {
  // Memory settings (in GB)
  minMemory: number;
  maxMemory: number;

  // Garbage collector settings
  gcType: GCType;
  maxGCPauseMillis: number;

  // Performance flags
  parallelRefProc: boolean;
  useAOTCache: boolean;

  // Feature toggles
  enableBackups: boolean;
  enableSentry: boolean;

  // Custom JVM flags
  customFlags: string;
}

export interface JVMPresetConfig {
  name: string;
  description: string;
  config: JVMConfig;
}

// Preset configurations
export const JVM_PRESETS: Record<JVMPreset, JVMPresetConfig> = {
  casual: {
    name: 'Casual',
    description: 'For small servers with 1-10 players. Minimal resource usage.',
    config: {
      minMemory: 2,
      maxMemory: 4,
      gcType: 'G1GC',
      maxGCPauseMillis: 200,
      parallelRefProc: false,
      useAOTCache: false,
      enableBackups: true,
      enableSentry: false,
      customFlags: '-XX:+UseStringDeduplication',
    },
  },
  community: {
    name: 'Community',
    description: 'For medium servers with 10-30 players. Balanced performance.',
    config: {
      minMemory: 4,
      maxMemory: 8,
      gcType: 'G1GC',
      maxGCPauseMillis: 150,
      parallelRefProc: true,
      useAOTCache: false,
      enableBackups: true,
      enableSentry: true,
      customFlags: '-XX:+UseStringDeduplication -XX:+OptimizeStringConcat',
    },
  },
  performance: {
    name: 'Performance',
    description: 'For large servers with 30-100 players. High performance optimizations.',
    config: {
      minMemory: 8,
      maxMemory: 16,
      gcType: 'ZGC',
      maxGCPauseMillis: 100,
      parallelRefProc: true,
      useAOTCache: true,
      enableBackups: true,
      enableSentry: true,
      customFlags: '-XX:+UseStringDeduplication -XX:+OptimizeStringConcat -XX:+AlwaysPreTouch',
    },
  },
  ultra: {
    name: 'Ultra',
    description: 'For massive servers with 100+ players. Maximum performance.',
    config: {
      minMemory: 16,
      maxMemory: 32,
      gcType: 'ZGC',
      maxGCPauseMillis: 50,
      parallelRefProc: true,
      useAOTCache: true,
      enableBackups: true,
      enableSentry: true,
      customFlags: '-XX:+UseStringDeduplication -XX:+OptimizeStringConcat -XX:+AlwaysPreTouch -XX:+UseLargePages',
    },
  },
};

// Convert JVM config to startup flags string
export function jvmConfigToFlags(config: JVMConfig): string {
  const flags: string[] = [];

  // Memory flags
  flags.push(`-Xms${config.minMemory}G`);
  flags.push(`-Xmx${config.maxMemory}G`);

  // GC flags
  if (config.gcType === 'G1GC') {
    flags.push('-XX:+UseG1GC');
    flags.push(`-XX:MaxGCPauseMillis=${config.maxGCPauseMillis}`);
    flags.push('-XX:G1HeapRegionSize=32M');
  } else if (config.gcType === 'ZGC') {
    flags.push('-XX:+UseZGC');
    flags.push('-XX:+ZGenerational');
  }

  // Parallel reference processing
  if (config.parallelRefProc) {
    flags.push('-XX:+ParallelRefProcEnabled');
  }

  // AOT cache
  if (config.useAOTCache) {
    flags.push('-XX:+UseSharedSpaces');
    flags.push('-XX:SharedArchiveFile=./cache/jvm.jsa');
  }

  // Custom flags
  if (config.customFlags.trim()) {
    flags.push(config.customFlags.trim());
  }

  return flags.join(' ');
}

// Parse startup flags string to JVM config
export function flagsToJvmConfig(flags: string): Partial<JVMConfig> {
  const config: Partial<JVMConfig> = {};
  const flagArray = flags.split(/\s+/).filter(f => f.trim());

  for (const flag of flagArray) {
    // Memory
    if (flag.startsWith('-Xms')) {
      const match = flag.match(/-Xms(\d+)G/i);
      if (match) config.minMemory = parseInt(match[1]);
    }
    if (flag.startsWith('-Xmx')) {
      const match = flag.match(/-Xmx(\d+)G/i);
      if (match) config.maxMemory = parseInt(match[1]);
    }

    // GC type
    if (flag === '-XX:+UseG1GC') {
      config.gcType = 'G1GC';
    }
    if (flag === '-XX:+UseZGC') {
      config.gcType = 'ZGC';
    }

    // Max GC pause
    if (flag.startsWith('-XX:MaxGCPauseMillis=')) {
      const match = flag.match(/=(\d+)/);
      if (match) config.maxGCPauseMillis = parseInt(match[1]);
    }

    // Parallel ref proc
    if (flag === '-XX:+ParallelRefProcEnabled') {
      config.parallelRefProc = true;
    }

    // AOT cache
    if (flag.includes('SharedArchiveFile')) {
      config.useAOTCache = true;
    }
  }

  return config;
}

// Live JVM metrics
export interface JVMMetrics {
  // Memory metrics
  heapUsed: number; // in MB
  heapMax: number; // in MB
  heapUsedPercent: number;

  // GC metrics
  gcPauseTimeMs: number; // average pause time
  gcCount: number; // number of GC events in last hour

  // Performance metrics
  tps: {
    current: number;
    average: number;
    min: number;
    max: number;
  };

  // Server metrics
  viewDistance: {
    configured: number;
    effective: number;
  };

  timestamp: number;
}

// Startup variable types for Pelican API
export interface StartupVariable {
  name: string;
  description: string;
  env_variable: string;
  default_value: string;
  server_value: string;
  user_viewable: boolean;
  user_editable: boolean;
  rules: string;
}

export interface StartupVariablesResponse {
  object: string;
  attributes: {
    data: StartupVariable[];
  };
}
