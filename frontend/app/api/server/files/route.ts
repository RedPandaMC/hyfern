import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDockerClient } from '@/lib/docker';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path') || '/data';

    const dockerClient = getDockerClient();
    const containerName = process.env.HYTALE_SERVER_CONTAINER || 'hyfern-hytale';

    const result = await dockerClient.execCommandInContainer(containerName, `ls -la ${filePath}`);

    if (!result.success) {
      return NextResponse.json({ error: result.output }, { status: 500 });
    }

    const fileList = result.output
      .split('\n')
      .slice(1)
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(/\s+/);
        const isDirectory = parts[0].startsWith('d');
        const size = parseInt(parts[4]) || 0;
        const name = parts[8] || parts[9];
        
        if (!name || name === '.' || name === '..') return null;

        return {
          name,
          isDirectory,
          size,
          modified: parts.slice(5, 8).join(' '),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ files: fileList });
  } catch (error) {
    console.error('Failed to list files:', error);
    return NextResponse.json(
      { error: 'Failed to list files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
