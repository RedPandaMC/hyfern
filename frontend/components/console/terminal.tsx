'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function ConsoleTerminal({ className = '' }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string>('');

  // Cleanup WebSocket connection
  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(async () => {
    try {
      setStatus('connecting');
      setError('');

      // Get WebSocket connection details from API
      const response = await fetch('/api/server/console');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get console connection');
      }

      const data = await response.json();

      if (!data.success || !data.socket) {
        throw new Error('Invalid WebSocket connection data');
      }

      // Create WebSocket connection
      const ws = new WebSocket(data.socket);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setError('');

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln('\r\n\x1b[32m[HyFern] Connected to server console\x1b[0m\r\n');
        }

        // Send authentication message if needed
        ws.send(JSON.stringify({
          event: 'auth',
          args: [''],
        }));

        // Request initial output
        ws.send(JSON.stringify({
          event: 'send logs',
          args: [null],
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (terminalInstanceRef.current) {
            // Handle different message types from Wings
            if (data.event === 'console output') {
              // Write console output to terminal
              const output = data.args?.[0] || '';
              terminalInstanceRef.current.write(output.replace(/\n/g, '\r\n'));
            } else if (data.event === 'stats') {
              // Ignore stats events (handled elsewhere)
            } else if (data.event === 'status') {
              // Server status updates
              const statusMsg = data.args?.[0] || '';
              terminalInstanceRef.current.writeln(`\r\n\x1b[33m[Status] ${statusMsg}\x1b[0m\r\n`);
            } else if (data.event === 'token expiring' || data.event === 'token expired') {
              // Handle token expiration
              terminalInstanceRef.current.writeln('\r\n\x1b[31m[HyFern] Session expired, reconnecting...\x1b[0m\r\n');
              cleanupWebSocket();
              reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setStatus('error');
        setError('Connection error occurred');

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln('\r\n\x1b[31m[HyFern] Connection error\x1b[0m\r\n');
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln('\r\n\x1b[33m[HyFern] Disconnected from server console\x1b[0m\r\n');
          terminalInstanceRef.current.writeln('\x1b[33m[HyFern] Reconnecting in 5 seconds...\x1b[0m\r\n');
        }

        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };
    } catch (err) {
      console.error('Failed to connect to console:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');

      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.writeln(`\r\n\x1b[31m[HyFern] Error: ${err instanceof Error ? err.message : 'Unknown error'}\x1b[0m\r\n`);
        terminalInstanceRef.current.writeln('\x1b[33m[HyFern] Retrying in 10 seconds...\x1b[0m\r\n');
      }

      // Retry after 10 seconds
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 10000);
    }
  }, [cleanupWebSocket]);

  // Send command to server
  const sendCommand = useCallback((command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: 'send command',
        args: [command],
      }));
    }
  }, []);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminalInstanceRef.current) {
      return;
    }

    // Create terminal instance with custom theme
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'var(--font-mono), monospace',
      theme: {
        background: '#0C1222',
        foreground: '#F8FAFC',
        cursor: '#00D4AA',
        cursorAccent: '#0C1222',
        selectionBackground: '#00D4AA33',
        black: '#0C1222',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#A855F7',
        cyan: '#00D4AA',
        white: '#F8FAFC',
        brightBlack: '#475569',
        brightRed: '#F87171',
        brightGreen: '#34D399',
        brightYellow: '#FBBF24',
        brightBlue: '#60A5FA',
        brightMagenta: '#C084FC',
        brightCyan: '#2DD4BF',
        brightWhite: '#FFFFFF',
      },
      allowProposedApi: true,
      scrollback: 1000,
      convertEol: true,
    });

    // Create addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    // Load addons
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal
    terminal.open(terminalRef.current);

    // Fit terminal to container
    fitAddon.fit();

    // Handle terminal input
    terminal.onData((data) => {
      // Handle special keys
      if (data === '\r') {
        // Enter key - not needed as we're read-only for most users
        // Commands are handled by the server
      } else if (data === '\u007F') {
        // Backspace - not needed in read-only mode
      } else {
        // Send input as command (for admin users who can send commands)
        if (data === '\r') {
          sendCommand(data);
        }
      }
    });

    // Store references
    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Show initial message
    terminal.writeln('\x1b[36m╔════════════════════════════════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[36m║                                                                ║\x1b[0m');
    terminal.writeln('\x1b[36m║\x1b[0m              \x1b[1m\x1b[32mHyFern Server Console\x1b[0m                         \x1b[36m║\x1b[0m');
    terminal.writeln('\x1b[36m║                                                                ║\x1b[0m');
    terminal.writeln('\x1b[36m╚════════════════════════════════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');

    // Connect to WebSocket
    connectWebSocket();

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupWebSocket();

      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }

      fitAddonRef.current = null;
    };
  }, [connectWebSocket, cleanupWebSocket, sendCommand]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              status === 'connected'
                ? 'bg-green-500'
                : status === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : status === 'error'
                ? 'bg-red-500'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-sm font-medium">
            {status === 'connected'
              ? 'Connected'
              : status === 'connecting'
              ? 'Connecting...'
              : status === 'error'
              ? 'Error'
              : 'Disconnected'}
          </span>
        </div>

        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>

      {/* Terminal container */}
      <div className="flex-1 p-4 bg-background overflow-hidden">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
}
