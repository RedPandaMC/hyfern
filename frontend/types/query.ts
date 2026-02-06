export interface Player {
  username: string;
  uuid: string;
  displayName?: string;
  ping?: number;
}

export interface QueryResponse {
  online: boolean;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  players: {
    online: number;
    max: number;
    list: Player[];
  };
  performance: {
    tps: number;
    mspt: number;
  };
  resources: {
    memory: {
      used: number;
      max: number;
      free: number;
    };
    cpu: {
      usage: number;
      cores: number;
    };
  };
  version?: string;
  motd?: string;
  timestamp: number;
}

export interface QueryError {
  error: string;
  message: string;
  timestamp: number;
}
