'use client';

import useSWR from 'swr';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MemoryStick } from '@/lib/icons';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface MemoryChartProps {
  range: string;
}

export function MemoryChart({ range }: MemoryChartProps) {
  const { data, error, isLoading } = useSWR(
    `/api/metrics?type=memory&range=${range}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const chartData = data?.data?.map((d: any) => ({
    time: formatTime(d.time),
    used: Math.round(d.used),
    max: d.max ? Math.round(d.max) : null,
  })) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MemoryStick className="h-4 w-4" />
          Heap Memory Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Loading memory data...
          </div>
        ) : error || chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No memory data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => `${v}MB`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value) => [`${value} MB`]}
              />
              <Area
                type="monotone"
                dataKey="max"
                stroke="#6b7280"
                fill="#6b728020"
                strokeDasharray="3 3"
                strokeWidth={1}
                dot={false}
                name="Max Heap"
              />
              <Area
                type="monotone"
                dataKey="used"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.2)"
                strokeWidth={2}
                dot={false}
                name="Used Heap"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
