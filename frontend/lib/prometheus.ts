interface PrometheusClientConfig {
  url: string;
  job?: string;
}

interface PrometheusQueryResult {
  metric: Record<string, string>;
  value: [number, string];
}

interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: PrometheusQueryResult[];
  };
}

export interface PrometheusMetrics {
  tps: number | null;
  mspt: number | null;
  heapUsed: number | null;
  heapMax: number | null;
  chunks: number | null;
  entities: number | null;
  timestamp: number;
}

export class PrometheusClient {
  private config: PrometheusClientConfig;

  constructor(config: PrometheusClientConfig) {
    this.config = {
      job: 'hytale',
      ...config,
    };
  }

  private async query(promql: string): Promise<PrometheusQueryResult[]> {
    try {
      const url = `${this.config.url}/api/v1/query?query=${encodeURIComponent(promql)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Prometheus API returned ${response.status}`);
      }

      const data: PrometheusResponse = await response.json();

      if (data.status !== 'success') {
        throw new Error('Prometheus query failed');
      }

      return data.data.result;
    } catch (error) {
      console.error('Failed to query Prometheus:', error);
      return [];
    }
  }

  private extractValue(results: PrometheusQueryResult[]): number | null {
    if (results.length === 0) return null;
    const value = parseFloat(results[0].value[1]);
    return isNaN(value) ? null : value;
  }

  async getMetrics(): Promise<PrometheusMetrics> {
    const jobFilter = `job="${this.config.job}"`;

    const [tpsResults, msptResults, heapUsedResults, heapMaxResults, chunksResults, entitiesResults] = await Promise.all([
      this.query(`minecraft_tps{${jobFilter}}`),
      this.query(`minecraft_mspt{${jobFilter}}`),
      this.query(`jvm_memory_used_bytes{${jobFilter},area="heap"}`),
      this.query(`jvm_memory_max_bytes{${jobFilter},area="heap"}`),
      this.query(`minecraft_chunks_loaded{${jobFilter}}`),
      this.query(`minecraft_entities{${jobFilter}}`),
    ]);

    return {
      tps: this.extractValue(tpsResults),
      mspt: this.extractValue(msptResults),
      heapUsed: this.extractValue(heapUsedResults),
      heapMax: this.extractValue(heapMaxResults),
      chunks: this.extractValue(chunksResults),
      entities: this.extractValue(entitiesResults),
      timestamp: Date.now(),
    };
  }

  async getTPS(): Promise<number | null> {
    const results = await this.query(`minecraft_tps{job="${this.config.job}"}`);
    return this.extractValue(results);
  }

  async getHeapMemory(): Promise<{ used: number | null; max: number | null }> {
    const jobFilter = `job="${this.config.job}"`;
    const [usedResults, maxResults] = await Promise.all([
      this.query(`jvm_memory_used_bytes{${jobFilter},area="heap"}`),
      this.query(`jvm_memory_max_bytes{${jobFilter},area="heap"}`),
    ]);

    return {
      used: this.extractValue(usedResults),
      max: this.extractValue(maxResults),
    };
  }

  async queryRange(promql: string, start: number, end: number, step: string = '15s'): Promise<any> {
    try {
      const url = `${this.config.url}/api/v1/query_range?query=${encodeURIComponent(promql)}&start=${start}&end=${end}&step=${step}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Prometheus API returned ${response.status}`);
      }

      const data = await response.json();
      return data.data.result;
    } catch (error) {
      console.error('Failed to query Prometheus range:', error);
      return [];
    }
  }
}

// Default client instance using environment variables
let _prometheusClient: PrometheusClient | null | undefined = undefined;

export function createPrometheusClient(): PrometheusClient | null {
  const url = process.env.PROMETHEUS_URL;

  if (!url) {
    console.warn('PROMETHEUS_URL not configured, Prometheus metrics will not be available');
    return null;
  }

  return new PrometheusClient({
    url,
    job: process.env.PROMETHEUS_JOB || 'hytale',
  });
}

export function getPrometheusClient(): PrometheusClient | null {
  if (_prometheusClient === undefined) {
    _prometheusClient = createPrometheusClient();
  }
  return _prometheusClient;
}
