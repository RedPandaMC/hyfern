'use client';

import { Button } from '@/components/ui/button';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
}

const ranges = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? 'default' : 'ghost'}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
