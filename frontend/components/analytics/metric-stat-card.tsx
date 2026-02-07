'use client';

import { Card, CardContent } from '@/components/ui/card';
import { type IconType } from 'react-icons';

interface MetricStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: IconType;
  color?: string;
}

export function MetricStatCard({ title, value, subtitle, icon: Icon, color = 'text-primary' }: MetricStatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color} opacity-60`} />
        </div>
      </CardContent>
    </Card>
  );
}
