'use client';

import useSWR from 'swr';
import { QueryResponse, QueryError } from '@/types/query';

const fetcher = async (url: string): Promise<QueryResponse> => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch server status');
  }

  return response.json();
};

export interface UseServerStatusReturn {
  data: QueryResponse | undefined;
  error: QueryError | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
}

export function useServerStatus(refreshInterval: number = 5000): UseServerStatusReturn {
  const { data, error, isLoading, isValidating, mutate } = useSWR<QueryResponse>(
    '/api/server/query',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data,
    error: error ? { error: 'FETCH_FAILED', message: error.message, timestamp: Date.now() } : undefined,
    isLoading,
    isValidating,
    mutate,
  };
}
