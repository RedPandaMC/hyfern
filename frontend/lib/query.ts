import { QueryResponse, QueryError } from '@/types/query';

interface QueryClientConfig {
  webserverUrl: string;
  username: string;
  password: string;
  queryEndpoint?: string;
}

export class QueryClient {
  private config: QueryClientConfig;

  constructor(config: QueryClientConfig) {
    this.config = {
      queryEndpoint: '/api/query',
      ...config,
    };
  }

  private getAuthHeader(): string {
    const credentials = `${this.config.username}:${this.config.password}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  async getServerStatus(): Promise<QueryResponse> {
    try {
      const url = `${this.config.webserverUrl}${this.config.queryEndpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Query API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as QueryResponse;
    } catch (error) {
      console.error('Failed to fetch server status:', error);
      throw error;
    }
  }

  async getServerStatusSafe(): Promise<QueryResponse | QueryError> {
    try {
      return await this.getServerStatus();
    } catch (error) {
      return {
        error: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }
}

// Default client instance using environment variables
let _queryClient: QueryClient | null = null;

export function createQueryClient(): QueryClient {
  const webserverUrl = process.env.HYTALE_WEBSERVER_URL;
  const username = process.env.HYTALE_WEBSERVER_USERNAME;
  const password = process.env.HYTALE_WEBSERVER_PASSWORD;

  if (!webserverUrl || !username || !password) {
    throw new Error('Missing required environment variables for Query API client');
  }

  return new QueryClient({
    webserverUrl,
    username,
    password,
  });
}

export function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = createQueryClient();
  }
  return _queryClient;
}
