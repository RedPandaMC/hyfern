import { QueryResponse, QueryError } from '@/types/query';
import { logger } from '@/lib/logger';

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
      queryEndpoint: '/Nitrado/Query',
      ...config,
    };
  }

  private getAuthHeader(): string {
    const credentials = `${this.config.username}:${this.config.password}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  async getServerStatus(signal?: AbortSignal): Promise<QueryResponse> {
    try {
      const url = `${this.config.webserverUrl}${this.config.queryEndpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/x.hytale.nitrado.query+json;version=1',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal,
      });

      if (!response.ok) {
        throw new Error(`Query API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as QueryResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Query request timed out');
      }
      logger.error('Failed to fetch server status:', { context: 'query', error: error as Error });
      throw error;
    }
  }

  async getServerStatusSafe(timeoutMs: number = 5000): Promise<QueryResponse | QueryError> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await this.getServerStatus(controller.signal);
    } catch (error) {
      return {
        error: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    } finally {
      clearTimeout(timeoutId);
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
