'use client';

import { FolderOpen, FileText, Download, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FilesContent() {
  const wingsUrl = process.env.NEXT_PUBLIC_WINGS_URL || 'http://api.hyfern.us';

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-[#00D4AA]/10">
            <FolderOpen className="w-6 h-6 text-[#00D4AA]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              File Manager
            </h3>
            <p className="text-gray-400 mb-4">
              For advanced file management, use the Wings API interface. This provides
              full access to browse, edit, upload, and download server files.
            </p>
            <Button
              onClick={() => window.open(wingsUrl, '_blank')}
              className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Wings File Manager
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-[#0C1222] border-gray-800 hover:border-[#00D4AA]/50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <FolderOpen className="w-5 h-5 text-[#00D4AA]" />
            <h4 className="font-semibold text-white">Server Logs</h4>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            View and download server logs for debugging
          </p>
          <div className="text-xs text-gray-500 font-mono">
            /server/logs/
          </div>
        </Card>

        <Card className="p-6 bg-[#0C1222] border-gray-800 hover:border-[#00D4AA]/50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <FolderOpen className="w-5 h-5 text-[#00D4AA]" />
            <h4 className="font-semibold text-white">Mods Folder</h4>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Manage installed mods and plugins
          </p>
          <div className="text-xs text-gray-500 font-mono">
            /server/mods/
          </div>
        </Card>

        <Card className="p-6 bg-[#0C1222] border-gray-800 hover:border-[#00D4AA]/50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-[#00D4AA]" />
            <h4 className="font-semibold text-white">Config Files</h4>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Edit server and plugin configuration files
          </p>
          <div className="text-xs text-gray-500 font-mono">
            /server/config.json
          </div>
        </Card>

        <Card className="p-6 bg-[#0C1222] border-gray-800 hover:border-[#00D4AA]/50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <FolderOpen className="w-5 h-5 text-[#00D4AA]" />
            <h4 className="font-semibold text-white">World Data</h4>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Access world save files and backups
          </p>
          <div className="text-xs text-gray-500 font-mono">
            /server/worlds/
          </div>
        </Card>

        <Card className="p-6 bg-[#0C1222] border-gray-800 hover:border-[#00D4AA]/50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-5 h-5 text-[#00D4AA]" />
            <h4 className="font-semibold text-white">Backups</h4>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Download and restore server backups
          </p>
          <div className="text-xs text-gray-500 font-mono">
            /backups/
          </div>
        </Card>

        <Card className="p-6 bg-[#0C1222] border-gray-800 hover:border-[#00D4AA]/50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-[#00D4AA]" />
            <h4 className="font-semibold text-white">Plugin Configs</h4>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Configure plugin settings and permissions
          </p>
          <div className="text-xs text-gray-500 font-mono">
            /server/mods/*/config.json
          </div>
        </Card>
      </div>

      {/* File Operations Guide */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Common Operations
        </h3>
        <div className="space-y-4 text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Upload Files</h4>
            <p className="text-sm text-gray-400">
              Use the Wings interface to upload new files, mods, or configuration updates.
              Supports drag-and-drop for easy file management.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Edit Configuration</h4>
            <p className="text-sm text-gray-400">
              Click on any configuration file to open the built-in editor. Changes are
              saved immediately and can be rolled back if needed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Download Backups</h4>
            <p className="text-sm text-gray-400">
              Download complete server backups or individual files. Backups are automatically
              compressed for faster downloads.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">File Permissions</h4>
            <p className="text-sm text-gray-400">
              All file operations require ADMIN role or higher. File changes may require a
              server restart to take effect.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
