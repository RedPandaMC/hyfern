'use client';

import { useState } from 'react';
import { Download, ExternalLink, Check, Lock } from '@/lib/icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CurseForgeMod } from '@/types/curseforge';

interface ModCardProps {
  mod: CurseForgeMod;
  isInstalled: boolean;
  onInstall: () => void;
}

// Core plugin IDs that cannot be uninstalled
const CORE_PLUGINS = [
  'nitrado-webserver',
  'nitrado-query',
  'nitrado-performancesaver',
  'apexhosting-prometheusexporter'
];

export function ModCard({ mod, isInstalled, onInstall }: ModCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isCoreMod = CORE_PLUGINS.includes(mod.slug.toLowerCase());

  const formatDownloads = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="bg-[#0C1222] border-gray-800 hover:border-[#00D4AA]/50 transition-colors overflow-hidden group">
      {/* Mod Logo */}
      <div className="relative h-40 bg-[#1a1f35] overflow-hidden">
        {mod.logo ? (
          <img
            src={mod.logo.thumbnailUrl}
            alt={mod.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-gray-600">📦</span>
          </div>
        )}

        {/* Core Plugin Badge */}
        {isCoreMod && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              <Lock className="w-3 h-3 mr-1" />
              Core Plugin
            </Badge>
          </div>
        )}

        {/* Featured Badge */}
        {mod.isFeatured && !isCoreMod && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-[#00D4AA]/20 text-[#00D4AA] border-[#00D4AA]/30">
              Featured
            </Badge>
          </div>
        )}

        {/* Installed Badge */}
        {isInstalled && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <Check className="w-3 h-3 mr-1" />
              Installed
            </Badge>
          </div>
        )}
      </div>

      {/* Mod Info */}
      <div className="p-4 space-y-3">
        {/* Title and Author */}
        <div>
          <h3 className="font-semibold text-white text-lg truncate">
            {mod.name}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            by {mod.authors[0]?.name || 'Unknown'}
          </p>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-300 line-clamp-2">
          {mod.summary}
        </p>

        {/* Categories */}
        {mod.categories && mod.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mod.categories.slice(0, 3).map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                className="text-xs border-gray-700 text-gray-400"
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>{formatDownloads(mod.downloadCount)}</span>
          </div>
          <div className="text-xs">
            Updated {formatDate(mod.dateModified)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isCoreMod ? (
            <Button
              className="flex-1 bg-gray-700 hover:bg-gray-700 cursor-not-allowed"
              disabled
            >
              <Lock className="w-4 h-4 mr-2" />
              Core Plugin
            </Button>
          ) : isInstalled ? (
            <Button
              className="flex-1 bg-green-500/20 text-green-500 hover:bg-green-500/30 border border-green-500/30"
              disabled
            >
              <Check className="w-4 h-4 mr-2" />
              Installed
            </Button>
          ) : (
            <Button
              onClick={onInstall}
              className="flex-1 bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
            >
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => window.open(mod.links.websiteUrl, '_blank')}
            className="border-gray-700 hover:bg-gray-800"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
