import { PowerAction, PowerActionResponse } from '@/types/server';

interface WingsClientConfig {
  apiUrl: string;
  apiKey: string;
  serverUuid: string;
}

export class WingsClient {
  private config: WingsClientConfig;

  constructor(config: WingsClientConfig) {
    this.config = config;
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private getServerUrl(): string {
    return `${this.config.apiUrl}/api/servers/${this.config.serverUuid}`;
  }

  async sendPowerAction(action: PowerAction['action']): Promise<PowerActionResponse> {
    try {
      const url = `${this.getServerUrl()}/power`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ signal: action }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Wings API returned ${response.status}: ${errorText}`);
      }

      return {
        success: true,
        action,
        message: `Server ${action} command sent successfully`,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Failed to send power action ${action}:`, error);
      return {
        success: false,
        action,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  async startServer(): Promise<PowerActionResponse> {
    return this.sendPowerAction('start');
  }

  async stopServer(): Promise<PowerActionResponse> {
    return this.sendPowerAction('stop');
  }

  async restartServer(): Promise<PowerActionResponse> {
    return this.sendPowerAction('restart');
  }

  async killServer(): Promise<PowerActionResponse> {
    return this.sendPowerAction('kill');
  }

  async getServerState(): Promise<{ state: string; resources: any }> {
    try {
      const url = this.getServerUrl();

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Wings API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get server state:', error);
      throw error;
    }
  }

  async getWebSocketCredentials(): Promise<{
    token: string;
    socket: string;
  }> {
    try {
      const url = `${this.getServerUrl()}/websocket`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Wings API returned ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get WebSocket credentials:', error);
      throw error;
    }
  }

  async getFileContents(filePath: string): Promise<string> {
    try {
      const url = `${this.getServerUrl()}/files/contents?file=${encodeURIComponent(filePath)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Wings API returned ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Failed to get file contents for ${filePath}:`, error);
      throw error;
    }
  }

  async writeFileContents(filePath: string, content: string): Promise<void> {
    try {
      const url = `${this.getServerUrl()}/files/write?file=${encodeURIComponent(filePath)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: content,
      });

      if (!response.ok) {
        throw new Error(`Wings API returned ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to write file contents for ${filePath}:`, error);
      throw error;
    }
  }

  async listFiles(directory: string = '/'): Promise<any[]> {
    try {
      const url = `${this.getServerUrl()}/files/list?directory=${encodeURIComponent(directory)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Wings API returned ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error(`Failed to list files in ${directory}:`, error);
      throw error;
    }
  }
}

// Default client instance using environment variables
let _wingsClient: WingsClient | null = null;

export function createWingsClient(): WingsClient {
  const apiUrl = process.env.WINGS_API_URL;
  const apiKey = process.env.WINGS_API_KEY;
  const serverUuid = process.env.WINGS_SERVER_UUID || process.env.SERVER_UUID;

  if (!apiUrl || !apiKey || !serverUuid) {
    throw new Error('Missing required environment variables for Wings API client');
  }

  return new WingsClient({
    apiUrl,
    apiKey,
    serverUuid,
  });
}

export function getWingsClient(): WingsClient {
  if (!_wingsClient) {
    _wingsClient = createWingsClient();
  }
  return _wingsClient;
}
