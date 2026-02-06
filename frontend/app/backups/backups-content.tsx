'use client';

import { Save, Download, RotateCcw, Clock, HardDrive, ExternalLink, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function BackupsContent() {
  const wingsUrl = process.env.NEXT_PUBLIC_WINGS_URL || 'http://api.hyfern.us';

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-[#00D4AA]/10">
            <Save className="w-6 h-6 text-[#00D4AA]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Backup Management
            </h3>
            <p className="text-gray-400 mb-4">
              For full backup functionality including creation, restoration, and scheduling,
              use the Wings API backup manager. This provides enterprise-grade backup
              capabilities with compression and integrity verification.
            </p>
            <Button
              onClick={() => window.open(`${wingsUrl}/backups`, '_blank')}
              className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Backup Manager
            </Button>
          </div>
        </div>
      </Card>

      {/* Backup Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-[#0C1222] border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#00D4AA]" />
              <h4 className="font-semibold text-white">Automatic Backups</h4>
            </div>
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              Active
            </Badge>
          </div>
          <p className="text-sm text-gray-400">
            Automated backups run every 6 hours to ensure your data is always protected
          </p>
        </Card>

        <Card className="p-6 bg-[#0C1222] border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-[#00D4AA]" />
              <h4 className="font-semibold text-white">Storage</h4>
            </div>
            <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
              Available
            </Badge>
          </div>
          <p className="text-sm text-gray-400">
            Up to 10 backup slots with automatic rotation for older backups
          </p>
        </Card>

        <Card className="p-6 bg-[#0C1222] border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#00D4AA]" />
              <h4 className="font-semibold text-white">Integrity Checks</h4>
            </div>
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              Verified
            </Badge>
          </div>
          <p className="text-sm text-gray-400">
            All backups are verified with checksums to ensure data integrity
          </p>
        </Card>
      </div>

      {/* Backup Operations */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-6">
          Backup Operations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a1f35] border border-gray-800">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#00D4AA]/10">
                <Save className="w-5 h-5 text-[#00D4AA]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Create Backup</h4>
                <p className="text-sm text-gray-400">
                  Manually create a backup of your server at any time. The server
                  will continue running during the backup process.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a1f35] border border-gray-800">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#00D4AA]/10">
                <Download className="w-5 h-5 text-[#00D4AA]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Download Backup</h4>
                <p className="text-sm text-gray-400">
                  Download any backup to your local machine. Backups are compressed
                  as .tar.gz files for easy storage and transfer.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a1f35] border border-gray-800">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10">
                <RotateCcw className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Restore Backup</h4>
                <p className="text-sm text-gray-400">
                  Restore your server to a previous backup. This will stop the server,
                  restore all files, and restart automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#1a1f35] border border-gray-800">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#00D4AA]/10">
                <Clock className="w-5 h-5 text-[#00D4AA]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Schedule Backups</h4>
                <p className="text-sm text-gray-400">
                  Configure automated backup schedules. Set up daily, weekly, or
                  custom intervals to ensure regular backups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Best Practices */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Backup Best Practices
        </h3>
        <div className="space-y-3 text-gray-300">
          <div className="flex gap-3">
            <span className="text-[#00D4AA]">•</span>
            <div>
              <strong className="text-white">Regular Backups:</strong> Create backups before
              making major changes like installing mods or updating configurations.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00D4AA]">•</span>
            <div>
              <strong className="text-white">Off-site Storage:</strong> Download important
              backups to your local machine for additional safety.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00D4AA]">•</span>
            <div>
              <strong className="text-white">Test Restores:</strong> Periodically test
              backup restoration in a staging environment to ensure backups are working.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00D4AA]">•</span>
            <div>
              <strong className="text-white">Rotation Policy:</strong> Old backups are
              automatically deleted when storage is full. Download important backups
              before they're rotated out.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-[#00D4AA]">•</span>
            <div>
              <strong className="text-white">Backup Size:</strong> Backups include all
              server files, world data, and configurations. Size varies based on world
              size and installed mods.
            </div>
          </div>
        </div>
      </Card>

      {/* Warning */}
      <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-500 mb-1">Important</p>
            <p className="text-sm text-yellow-500/80">
              Restoring a backup will overwrite all current server files and data.
              This action cannot be undone. Always create a new backup before restoring
              an old one, just in case you need to revert.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
