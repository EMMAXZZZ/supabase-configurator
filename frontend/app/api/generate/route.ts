import { NextRequest, NextResponse } from 'next/server';
import { ConfigFormSchema } from '@/lib/validation';
import { generateSecureSecret, generatePassword, generateJWT, generateEnvFile, generateDockerCompose, generateDockerComposeOverride } from '@/lib/config-generator';
import type { GeneratedConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Prefer JSON body; fall back to formData if needed
    let data: any;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData as any);
      // Coerce boolean-like strings
      if (typeof data.enable_dev_override === 'string') {
        data.enable_dev_override = data.enable_dev_override === 'true';
      }
    } else {
      // Try JSON by default
      data = await request.json();
    }

    // Validate input using Zod schema
    const validatedData = ConfigFormSchema.parse(data);

    // Generate missing secrets
    const config: GeneratedConfig = {
      project_name: validatedData.project_name,
      domain: validatedData.domain,
      email: validatedData.email,
      db_password: validatedData.db_password || generatePassword(32),
      jwt_secret: validatedData.jwt_secret || generateSecureSecret(64),
      anon_key: '',
      service_key: '',
    };

    // Generate JWT tokens
    const anonPayload = { role: 'anon', iss: 'supabase' };
    const servicePayload = { role: 'service_role', iss: 'supabase' };

    config.anon_key = validatedData.anon_key || await generateJWT(config.jwt_secret, anonPayload);
    config.service_key = validatedData.service_key || await generateJWT(config.jwt_secret, servicePayload);

    // Generate configuration files
    const envContent = generateEnvFile(config);
    const composeContent = generateDockerCompose(config);
    const overrideContent = generateDockerComposeOverride(config);

    return NextResponse.json({
      envContent,
      composeContent,
      overrideContent,
      config
    });

  } catch (error: any) {
    console.error('Configuration generation failed:', error);

    if (error.name === 'ZodError') {
      const errorMessages = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({ error: 'Validation failed', errors: errorMessages }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? error.message : 'Configuration generation failed' },
      { status: 500 }
    );
  }
}
