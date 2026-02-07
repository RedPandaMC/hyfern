'use client';

import { Card } from '@/components/ui/card';
import { MemoryStick, Cpu } from '@/lib/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ResourceChartsProps {
  memory: {
    used: number;
    max: number;
    free: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
}

export function ResourceCharts({ memory, cpu }: ResourceChartsProps) {
  // Convert bytes to GB
  const memoryUsedGB = (memory.used / 1024 / 1024 / 1024).toFixed(2);
  const memoryMaxGB = (memory.max / 1024 / 1024 / 1024).toFixed(2);
  const memoryPercentage = ((memory.used / memory.max) * 100).toFixed(1);

  // Get color based on usage percentage
  const getMemoryColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getCpuColor = (usage: number): string => {
    if (usage >= 80) return 'text-red-500';
    if (usage >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Memory Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MemoryStick className="h-5 w-5" />
            Memory Usage
          </h3>
        </div>

        <div className="space-y-4">
          {/* Memory stats */}
          <div className="flex items-end justify-between">
            <div>
              <div className={`text-3xl font-bold ${getMemoryColor(parseFloat(memoryPercentage))}`}>
                {memoryPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {memoryUsedGB} GB / {memoryMaxGB} GB
              </div>
            </div>
          </div>

          {/* Memory bar */}
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                parseFloat(memoryPercentage) >= 90
                  ? 'bg-red-500'
                  : parseFloat(memoryPercentage) >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${memoryPercentage}%` }}
            />
          </div>

          {/* Memory breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center">
              <div className="text-sm font-medium">{memoryUsedGB} GB</div>
              <div className="text-xs text-muted-foreground">Used</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">
                {((memory.free / 1024 / 1024 / 1024).toFixed(2))} GB
              </div>
              <div className="text-xs text-muted-foreground">Free</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{memoryMaxGB} GB</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
      </Card>

      {/* CPU Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            CPU Usage
          </h3>
        </div>

        <div className="space-y-4">
          {/* CPU stats */}
          <div className="flex items-end justify-between">
            <div>
              <div className={`text-3xl font-bold ${getCpuColor(cpu.usage)}`}>
                {cpu.usage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {cpu.cores} {cpu.cores === 1 ? 'Core' : 'Cores'}
              </div>
            </div>
          </div>

          {/* CPU bar */}
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                cpu.usage >= 80
                  ? 'bg-red-500'
                  : cpu.usage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(cpu.usage, 100)}%` }}
            />
          </div>

          {/* CPU info */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="text-center">
              <div className="text-sm font-medium">{cpu.usage.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Current</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{cpu.cores}</div>
              <div className="text-xs text-muted-foreground">Cores</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
