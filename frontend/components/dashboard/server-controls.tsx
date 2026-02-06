'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Power, RotateCw, Square, Skull } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@/app/generated/prisma';

interface ServerControlsProps {
  isOnline: boolean;
  onActionComplete?: () => void;
}

export function ServerControls({ isOnline, onActionComplete }: ServerControlsProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  // Check if user has admin permissions
  const isAdmin = session?.user?.role && (session.user.role === Role.ADMIN || session.user.role === Role.OWNER);

  const sendPowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
    setIsLoading(true);
    setCurrentAction(action);

    try {
      const response = await fetch('/api/server/power', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Server ${action} command sent successfully`);
        // Trigger refresh after a delay to allow server state to update
        setTimeout(() => {
          onActionComplete?.();
        }, 2000);
      } else {
        toast.error(data.message || `Failed to ${action} server`);
      }
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
      toast.error(`Failed to ${action} server`);
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Server Controls</h3>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => sendPowerAction('start')}
          disabled={isLoading || isOnline}
          variant="default"
          className="w-full"
        >
          {isLoading && currentAction === 'start' ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Start
            </>
          )}
        </Button>

        <Button
          onClick={() => sendPowerAction('stop')}
          disabled={isLoading || !isOnline}
          variant="destructive"
          className="w-full"
        >
          {isLoading && currentAction === 'stop' ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Stopping...
            </>
          ) : (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </>
          )}
        </Button>

        <Button
          onClick={() => sendPowerAction('restart')}
          disabled={isLoading || !isOnline}
          variant="secondary"
          className="w-full"
        >
          {isLoading && currentAction === 'restart' ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Restarting...
            </>
          ) : (
            <>
              <RotateCw className="mr-2 h-4 w-4" />
              Restart
            </>
          )}
        </Button>

        <Button
          onClick={() => sendPowerAction('kill')}
          disabled={isLoading || !isOnline}
          variant="destructive"
          className="w-full"
        >
          {isLoading && currentAction === 'kill' ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Killing...
            </>
          ) : (
            <>
              <Skull className="mr-2 h-4 w-4" />
              Force Kill
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Admin controls - use with caution</p>
      </div>
    </Card>
  );
}
