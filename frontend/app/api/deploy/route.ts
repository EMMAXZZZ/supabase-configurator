import { NextRequest, NextResponse } from 'next/server';
import { DeploymentSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Dynamically import SSH/SFTP libs to avoid bundling native modules at build time
    const SFTPClient = (await import('ssh2-sftp-client')).default as any;
    const { Client: SSHClient } = (await import('ssh2')) as any;

    const formData = await request.formData();
    const data: any = Object.fromEntries(formData.entries());

    // Convert port to number and normalize path
    if (data.vpsPort) {
      data.vpsPort = parseInt(data.vpsPort as string);
    }
    if (typeof data.remotePath === 'string') {
      // Ensure it starts with /
      if (!data.remotePath.startsWith('/')) data.remotePath = '/' + data.remotePath;
      // Remove trailing spaces
      data.remotePath = data.remotePath.trim();
    }
    // Coerce booleans from FormData strings
    if (typeof data.includeOverride === 'string') {
      data.includeOverride = data.includeOverride === 'true';
    }
    if (typeof data.runDockerUp === 'string') {
      data.runDockerUp = data.runDockerUp === 'true';
    }

    // Validate input using Zod schema
    const validatedData = DeploymentSchema.parse(data);

    const { vpsHost, vpsUser, vpsPort, vpsPassword, remotePath, envContent, composeContent, includeOverride, overrideContent, runDockerUp } = validatedData as any;

    const sftp = new SFTPClient();
    await sftp.connect({ host: vpsHost, port: vpsPort, username: vpsUser, password: vpsPassword });

    // Ensure remote directory exists
    try {
      await sftp.mkdir(remotePath, true);
    } catch (_) {
      // ignore if exists
    }

    // Upload files
    await sftp.put(Buffer.from(envContent, 'utf8'), `${remotePath}/.env`);
    await sftp.put(Buffer.from(composeContent, 'utf8'), `${remotePath}/docker-compose.yml`);
    if (includeOverride && overrideContent) {
      await sftp.put(Buffer.from(overrideContent, 'utf8'), `${remotePath}/docker-compose.override.yml`);
    }
    await sftp.end();

    if (runDockerUp) {
      await new Promise<void>((resolve, reject) => {
        const conn = new SSHClient();
        conn.on('ready', () => {
          conn.exec(`cd ${remotePath} && docker compose up -d`, (err: Error | null, stream: any) => {
            if (err) { conn.end(); return reject(err); }
            let stderr = '';
            stream.on('close', (code: number) => {
              conn.end();
              if (code === 0) resolve(); else reject(new Error(stderr || `docker compose exited with code ${code}`));
            }).stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
          });
        }).on('error', reject).connect({ host: vpsHost, port: vpsPort, username: vpsUser, password: vpsPassword });
      });
    }

    return NextResponse.json({ success: true, message: `Files uploaded to ${remotePath} on ${vpsHost}${runDockerUp ? ' and docker compose started' : ''}` });

  } catch (error: any) {
    console.error('Deployment failed:', error);

    if (error.name === 'ZodError') {
      const errorMessages = error.errors.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed',
          errors: errorMessages 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Deployment failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Deployment failed'
      },
      { status: 500 }
    );
  }
}
