import { StartupVariable, StartupVariablesResponse } from '@/types/jvm';

interface PelicanClientConfig {
  apiUrl: string;
  apiKey: string;
  serverUuid: string;
}

export class PelicanClient {
  private config: PelicanClientConfig;

  constructor(config: PelicanClientConfig) {
    this.config = config;
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.pelican.v1+json',
    };
  }

  private getServerUrl(): string {
    return `${this.config.apiUrl}/api/application/servers/${this.config.serverUuid}`;
  }

  /**
   * Get all startup variables for the server
   */
  async getStartupVariables(): Promise<StartupVariable[]> {
    try {
      const url = `${this.getServerUrl()}/startup`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pelican API returned ${response.status}: ${errorText}`);
      }

      const data: StartupVariablesResponse = await response.json();
      return data.attributes.data;
    } catch (error) {
      console.error('Failed to get startup variables:', error);
      throw error;
    }
  }

  /**
   * Get a specific startup variable by environment variable name
   */
  async getStartupVariable(envVariable: string): Promise<StartupVariable | null> {
    try {
      const variables = await this.getStartupVariables();
      return variables.find(v => v.env_variable === envVariable) || null;
    } catch (error) {
      console.error(`Failed to get startup variable ${envVariable}:`, error);
      throw error;
    }
  }

  /**
   * Update a startup variable value
   */
  async updateStartupVariable(
    envVariable: string,
    value: string
  ): Promise<void> {
    try {
      const url = `${this.getServerUrl()}/startup/variable`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          key: envVariable,
          value: value,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pelican API returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`Failed to update startup variable ${envVariable}:`, error);
      throw error;
    }
  }

  /**
   * Get JVM startup flags from the STARTUP environment variable
   */
  async getJVMFlags(): Promise<string> {
    try {
      const variable = await this.getStartupVariable('STARTUP');
      if (!variable) {
        throw new Error('STARTUP variable not found');
      }
      return variable.server_value || variable.default_value;
    } catch (error) {
      console.error('Failed to get JVM flags:', error);
      throw error;
    }
  }

  /**
   * Update JVM startup flags via the STARTUP environment variable
   */
  async updateJVMFlags(flags: string): Promise<void> {
    try {
      await this.updateStartupVariable('STARTUP', flags);
    } catch (error) {
      console.error('Failed to update JVM flags:', error);
      throw error;
    }
  }

  /**
   * Get server details
   */
  async getServerDetails(): Promise<any> {
    try {
      const url = this.getServerUrl();

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pelican API returned ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get server details:', error);
      throw error;
    }
  }

  /**
   * Reinstall server (triggers egg reinstall which applies new startup variables)
   */
  async reinstallServer(): Promise<void> {
    try {
      const url = `${this.getServerUrl()}/reinstall`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pelican API returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to reinstall server:', error);
      throw error;
    }
  }
}

// Default client instance using environment variables
let _pelicanClient: PelicanClient | null = null;

export function createPelicanClient(): PelicanClient {
  const apiUrl = process.env.PELICAN_API_URL;
  const apiKey = process.env.PELICAN_API_KEY;
  const serverUuid = process.env.PELICAN_SERVER_UUID || process.env.SERVER_UUID;

  if (!apiUrl || !apiKey || !serverUuid) {
    throw new Error('Missing required environment variables for Pelican API client');
  }

  return new PelicanClient({
    apiUrl,
    apiKey,
    serverUuid,
  });
}

export function getPelicanClient(): PelicanClient {
  if (!_pelicanClient) {
    _pelicanClient = createPelicanClient();
  }
  return _pelicanClient;
}
