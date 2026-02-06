export type PowerState = 'running' | 'stopped' | 'starting' | 'stopping';

export interface ServerConfig {
  id: string;
  name: string;
  description?: string;
  host: string;
  port: number;
  queryPort?: number;
  rconPort?: number;
  wings: {
    url: string;
    uuid: string;
  };
  prometheus?: {
    url: string;
    job: string;
  };
  webserver: {
    url: string;
    queryEndpoint: string;
  };
}

export interface PowerAction {
  action: 'start' | 'stop' | 'restart' | 'kill';
}

export interface PowerActionResponse {
  success: boolean;
  action: string;
  message?: string;
  timestamp: number;
}
