'use client';

import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from '@/lib/icons';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface TPSChartProps {
  range: string;
}

export function TPSChart({ range }: TPSChartProps) {
  const { data, error, isLoading } = useSWR(
    `/api/metrics?type=tps&range=${range}`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const chartData = data?.data?.map((d: any) => ({
    time: formatTime(d.time),
    tps: Math.round(d.value * 100) / 100,
  })) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4" />
          TPS Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Loading TPS data...
          </div>
        ) : error || chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No TPS data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                domain={[0, 22]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <ReferenceLine y={20} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: 'Ideal', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Warning', fill: '#ef4444', fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="tps"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
