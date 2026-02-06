'use client';

import { Player } from '@/types/query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  maxPlayers: number;
  isOnline: boolean;
}

export function PlayerList({ players, maxPlayers, isOnline }: PlayerListProps) {
  const onlineCount = players.length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Players Online
        </h3>
        <Badge variant={isOnline ? 'default' : 'secondary'}>
          {onlineCount}/{maxPlayers}
        </Badge>
      </div>

      {!isOnline ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Server is offline</p>
        </div>
      ) : onlineCount === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No players online</p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.uuid}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`https://crafatar.com/avatars/${player.uuid}?overlay=true`}
                  alt={player.username}
                />
                <AvatarFallback>
                  {player.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {player.displayName || player.username}
                </p>
                {player.ping !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Ping: {player.ping}ms
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
