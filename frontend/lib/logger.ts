/**
 * Centralized logging utility
 * Uses console in development, can be swapped for external service in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  level?: LogLevel;
  context?: string;
  error?: Error;
}

class Logger {
  private isDev: boolean;
  private isServer: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    this.isServer = typeof window === 'undefined';
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()}${ctx}: ${message}`;
  }

  debug(message: string, context?: string): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: string): void {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: string): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, options?: { context?: string; error?: Error }): void {
    const formatted = this.formatMessage('error', message, options?.context);
    
    // Always log errors
    // eslint-disable-next-line no-console
    console.error(formatted);
    
    if (options?.error) {
      // eslint-disable-next-line no-console
      console.error(options.error);
    }

    // In production, you could send to error tracking service here
    if (!this.isDev && this.isServer) {
      // Example: Sentry.captureException(options?.error || new Error(message));
    }
  }

  /**
   * Log an API error with request context
   */
  logApiError(
    endpoint: string,
    error: unknown,
    context?: { userId?: string; requestId?: string }
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.error(`API Error in ${endpoint}`, {
      context: context?.requestId || 'api',
      error: err,
    });
  }
}

export const logger = new Logger();
