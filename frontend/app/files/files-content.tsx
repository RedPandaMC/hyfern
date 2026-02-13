'use client';

import { useEffect } from 'react';
import { ExternalLink } from '@/lib/icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FilesContent() {
  const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.hyfern.us';

  useEffect(() => {
    window.open(panelUrl, '_blank');
  }, [panelUrl]);

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-card ">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            File management is handled through the Pelican Panel.
            A new tab should have opened automatically.
          </p>
          <Button
            onClick={() => window.open(panelUrl, '_blank')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Pelican Panel
          </Button>
        </div>
      </Card>
    </div>
  );
}
