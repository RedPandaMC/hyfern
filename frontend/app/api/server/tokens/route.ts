import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { Role } from '@/app/generated/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    requireRole(session, Role.ADMIN);

    const tokensFile = process.env.HYTALE_TOKENS_FILE || '/data/hytale/tokens/server-tokens.env';
    
    let tokensExist = false;
    let tokenDate: string | null = null;
    let daysUntilExpiry: number | null = null;

    try {
      const content = fs.readFileSync(tokensFile, 'utf-8');
      tokensExist = content.includes('HYTALE_SERVER_SESSION_TOKEN');
      
      // Extract the date from the comment line
      const dateMatch = content.match(/Generated on (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
      if (dateMatch) {
        tokenDate = dateMatch[1];
        const generatedDate = new Date(tokenDate);
        const expiryDate = new Date(generatedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const now = new Date();
        daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      }
    } catch {
      tokensExist = false;
    }

    return NextResponse.json({
      tokensExist,
      tokenDate,
      daysUntilExpiry,
      needsRefresh: daysUntilExpiry !== null && daysUntilExpiry <= 7,
      critical: daysUntilExpiry !== null && daysUntilExpiry <= 1,
    });
  } catch (error) {
    console.error('Failed to check token status:', error);
    return NextResponse.json({ error: 'Failed to check token status' }, { status: 500 });
  }
}