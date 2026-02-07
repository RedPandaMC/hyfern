'use client';

import { useEffect } from 'react';
import { ExternalLink } from '@/lib/icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function BackupsContent() {
  const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL || 'https://panel.hyfern.us';

  useEffect(() => {
    window.open(panelUrl, '_blank');
  }, [panelUrl]);

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-[#0C1222] border-gray-800">
        <div className="text-center space-y-4">
          <p className="text-gray-400">
            Backup management is handled through the Pelican Panel.
            A new tab should have opened automatically.
          </p>
          <Button
            onClick={() => window.open(panelUrl, '_blank')}
            className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Pelican Panel
          </Button>
        </div>
      </Card>
    </div>
  );
}
