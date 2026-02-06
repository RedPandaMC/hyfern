import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint for Docker and monitoring
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'hyfern-frontend',
  });
}
