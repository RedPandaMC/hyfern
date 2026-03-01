import { logger } from '@/lib/logger';

const DOCKER_SOCKET = process.env.DOCKER_HOST || 'unix:///var/run/docker.sock';
const CONTAINER_NAME = 'hyfern-hytale';

interface ContainerStatus {
  state: 'running' | 'stopped' | 'starting' | 'stopping' | 'restarting';
  status: string;
  uptime?: number;
  memory?: {
    used: number;
    limit: number;
  };
  cpu?: number;
}

interface LogLine {
  timestamp: string;
  message: string;
}

async function dockerRequest(method: string, path: string, body?: object): Promise<any> {
  const socketPath = DOCKER_SOCKET.replace('unix://', '');
  
  return new Promise((resolve, reject) => {
    const http = require('http');
    const client = require('http').request({
      socketPath,
      path,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    }, (res: any) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`Docker API error: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    client.on('error', reject);
    if (body) client.write(JSON.stringify(body));
    client.end();
  });
}

export class DockerClient {
  private containerName: string;

  constructor(containerName: string = CONTAINER_NAME) {
    this.containerName = containerName;
  }

  async getContainerId(): Promise<string | null> {
    try {
      const containers = await dockerRequest('GET', '/containers/json?all=true');
      const container = containers.find((c: any) => c.Names.some((n: string) => n === `/${this.containerName}`));
      return container ? container.Id : null;
    } catch (error) {
      logger.error('Failed to get container ID:', { context: 'docker', error: error as Error });
      return null;
    }
  }

  async getContainerStatus(): Promise<ContainerStatus> {
    try {
      const containerId = await this.getContainerId();
      if (!containerId) {
        return { state: 'stopped', status: 'not found' };
      }

      const info = await dockerRequest('GET', `/containers/${containerId}/json`);
      const state = info.State;
      
      let status: ContainerStatus = {
        state: 'stopped',
        status: state.Status,
      };

      if (state.Running) {
        status.state = 'running';
        
        const stats = await dockerRequest('GET', `/containers/${containerId}/stats?stream=false`);
        status.memory = {
          used: stats.memory_stats?.usage || 0,
          limit: stats.memory_stats?.limit || 0,
        };
        
        const cpuDelta = stats.cpu_stats?.cpu_usage?.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
        const systemDelta = stats.cpu_stats?.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
        const numCpus = stats.cpu_stats?.online_cpus || 1;
        
        if (systemDelta > 0 && cpuDelta > 0) {
          status.cpu = (cpuDelta / systemDelta) * numCpus * 100;
        }

        if (state.StartedAt) {
          const started = new Date(state.StartedAt);
          status.uptime = Math.floor((Date.now() - started.getTime()) / 1000);
        }
      } else if (state.Status === 'exited') {
        status.state = 'stopped';
      }

      return status;
    } catch (error) {
      logger.error('Failed to get container status:', { context: 'docker', error: error as Error });
      return { state: 'stopped', status: 'error' };
    }
  }

  async startContainer(): Promise<{ success: boolean; message: string }> {
    try {
      const containerId = await this.getContainerId();
      if (!containerId) {
        return { success: false, message: 'Container not found' };
      }

      await dockerRequest('POST', `/containers/${containerId}/start`);
      logger.info('Container started', { context: 'docker', container: this.containerName });
      
      return { success: true, message: 'Server started successfully' };
    } catch (error: any) {
      if (error.message.includes('304')) {
        return { success: true, message: 'Server already running' };
      }
      logger.error('Failed to start container:', { context: 'docker', error: error as Error });
      return { success: false, message: error.message };
    }
  }

  async stopContainer(): Promise<{ success: boolean; message: string }> {
    try {
      const containerId = await this.getContainerId();
      if (!containerId) {
        return { success: false, message: 'Container not found' };
      }

      await dockerRequest('POST', `/containers/${containerId}/stop?t=30`);
      logger.info('Container stopped', { context: 'docker', container: this.containerName });
      
      return { success: true, message: 'Server stopped successfully' };
    } catch (error: any) {
      if (error.message.includes('304')) {
        return { success: true, message: 'Server already stopped' };
      }
      logger.error('Failed to stop container:', { context: 'docker', error: error as Error });
      return { success: false, message: error.message };
    }
  }

  async restartContainer(): Promise<{ success: boolean; message: string }> {
    try {
      const containerId = await this.getContainerId();
      if (!containerId) {
        return { success: false, message: 'Container not found' };
      }

      await dockerRequest('POST', `/containers/${containerId}/restart?t=30`);
      logger.info('Container restarted', { context: 'docker', container: this.containerName });
      
      return { success: true, message: 'Server restarted successfully' };
    } catch (error: any) {
      logger.error('Failed to restart container:', { context: 'docker', error: error as Error });
      return { success: false, message: error.message };
    }
  }

  async getContainerLogs(tail: number = 100): Promise<LogLine[]> {
    try {
      const containerId = await this.getContainerId();
      if (!containerId) {
        return [];
      }

      return new Promise((resolve, reject) => {
        const http = require('http');
        const client = require('http').request({
          socketPath: DOCKER_SOCKET.replace('unix://', ''),
          path: `/containers/${containerId}/logs?stdout=true&stderr=true&tail=${tail}`,
          method: 'GET',
        }, (res: any) => {
          let data = '';
          res.on('data', (chunk: string) => data += chunk);
          res.on('end', () => {
            const lines: LogLine[] = [];
            const cleanData = data.replace(/[^\x20-\x7E\x0A]/g, '');
            const rawLines = cleanData.split('\n').filter((l: string) => l.trim());
            
            for (const line of rawLines) {
              const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z)\s*(.*)$/);
              if (match) {
                lines.push({ timestamp: match[1], message: match[2] });
              } else if (line.trim()) {
                lines.push({ timestamp: new Date().toISOString(), message: line.trim() });
              }
            }
            
            resolve(lines);
          });
        });
        
        client.on('error', reject);
        client.end();
      });
    } catch (error) {
      logger.error('Failed to get container logs:', { context: 'docker', error: error as Error });
      return [];
    }
  }

  async execCommand(command: string): Promise<{ success: boolean; output: string }> {
    try {
      const containerId = await this.getContainerId();
      if (!containerId) {
        return { success: false, output: 'Container not found' };
      }

      const exec = await dockerRequest('POST', `/containers/${containerId}/exec`, {
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ['sh', '-c', command],
        User: 'root',
      });

      await dockerRequest('POST', `/exec/${exec.Id}/start`, {
        Detach: false,
        Tty: false,
      });

      return { success: true, output: 'Command executed' };
    } catch (error) {
      logger.error('Failed to exec command:', { context: 'docker', error: error as Error });
      return { success: false, output: (error as Error).message };
    }
  }
}

let _dockerClient: DockerClient | null = null;

export function getDockerClient(): DockerClient {
  if (!_dockerClient) {
    _dockerClient = new DockerClient();
  }
  return _dockerClient;
}
