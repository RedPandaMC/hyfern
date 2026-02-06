'use client';

import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface TPSGaugeProps {
  tps: number;
  mspt: number;
}

export function TPSGauge({ tps, mspt }: TPSGaugeProps) {
  // Determine color based on TPS
  const getTPSColor = (tps: number): string => {
    if (tps >= 28) return 'text-green-500';
    if (tps >= 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTPSBgColor = (tps: number): string => {
    if (tps >= 28) return 'bg-green-500/10';
    if (tps >= 20) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  const getTPSRingColor = (tps: number): string => {
    if (tps >= 28) return 'stroke-green-500';
    if (tps >= 20) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const getTPSStatus = (tps: number): string => {
    if (tps >= 28) return 'Excellent';
    if (tps >= 20) return 'Good';
    return 'Poor';
  };

  // Calculate percentage for visual gauge (20 TPS = max)
  const percentage = Math.min((tps / 20) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Server Performance
        </h3>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        {/* Circular gauge */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className={getTPSRingColor(tps)}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.5s ease',
              }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${getTPSColor(tps)}`}>
              {tps.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">TPS</div>
          </div>
        </div>

        {/* Status badge */}
        <div className={`mt-4 px-4 py-2 rounded-full ${getTPSBgColor(tps)}`}>
          <span className={`font-medium ${getTPSColor(tps)}`}>
            {getTPSStatus(tps)}
          </span>
        </div>

        {/* MSPT info */}
        <div className="mt-6 w-full grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{mspt.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">MSPT</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{(20 - tps).toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Behind</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
