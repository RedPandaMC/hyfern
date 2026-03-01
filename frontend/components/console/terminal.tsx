'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { RefreshCcw, AlertCircle, Loader2 } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface TerminalProps {
  className?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function ConsoleTerminal({ className = '' }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string>('');
  const [lastLogTime, setLastLogTime] = useState<number>(0);

  const fetchLogs = useCallback(async () => {
    try {
      setStatus('connecting');
      const response = await fetch('/api/server/console');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get console logs');
      }

      const data = await response.json();

      if (data.logs && terminalInstanceRef.current) {
        const newLogTime = data.logs.length;
        if (newLogTime !== lastLogTime) {
          terminalInstanceRef.current.writeln(data.logs);
          setLastLogTime(newLogTime);
        }
      }

      setStatus('connected');
      setError('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [lastLogTime]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminalInstanceRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#e5e5e5',
        cursor: '#22c55e',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#264f78',
        black: '#0a0a0a',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff',
      },
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    terminal.writeln('\x1b[36m[HyFern] Loading server logs...\x1b[0m');

    // Initial fetch
    fetchLogs();

    // Set up polling every 3 seconds
    pollIntervalRef.current = setInterval(fetchLogs, 3000);

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      terminal.dispose();
      terminalInstanceRef.current = null;
    };
  }, [fetchLogs]);

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return `Error: ${error}`;
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {status === 'connecting' && <Loader2 className="w-3 h-3 inline animate-spin mr-1" />}
            {getStatusText()}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLogs}
          className="h-6 px-2 text-xs"
        >
          <RefreshCcw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Error overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Terminal container */}
      <div ref={terminalRef} className="h-full w-full pt-8" />
    </div>
  );
}
