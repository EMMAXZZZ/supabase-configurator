import type { GeneratedConfig } from '../types';

/**
 * Generate .env file for Supabase configuration
 */
export function generateEnvFile(
  config: GeneratedConfig,
  options?: { enable_vector?: boolean; enable_logflare?: boolean; enable_pgvector?: boolean }
): string {
  // Clean domain for environment variables
  const cleanDomain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0].split('?')[0].split('#')[0];
  
  const base = `# Supabase Configuration
# Generated on ${new Date().toISOString()}
# Project: ${config.project_name}

############
# GENERAL
############
STUDIO_PORT=3000
SITE_URL=https://${cleanDomain}
ADDITIONAL_REDIRECT_URLS=""
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=https://${cleanDomain}

############
# DATABASE
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_USER=supabase_admin
POSTGRES_PASSWORD=${config.db_password}
POSTGRES_PORT=5432

############
# API Proxy
############
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# AUTH
############
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_SMTP_ADMIN_EMAIL=${config.email}
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=${config.email}
GOTRUE_SMTP_PASS=your-smtp-password
GOTRUE_SMTP_SENDER_NAME=${config.project_name}

############
# JWT
############
JWT_SECRET=${config.jwt_secret}
ANON_KEY=${config.anon_key}
SERVICE_ROLE_KEY=${config.service_key}

############
# S3 STORAGE
############
STORAGE_BACKEND=file
STORAGE_FILE_SIZE_LIMIT=52428800
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ENDPOINT=""
STORAGE_S3_ACCESS_KEY_ID=""
STORAGE_S3_SECRET_ACCESS_KEY=""
STORAGE_S3_BUCKET=""

############
# ANALYTICS
############
LOGFLARE_API_KEY=""
LOGFLARE_URL=""

############
# VECTOR/EMBEDDINGS
############
OPENAI_API_KEY=""

############
# MISC
############
PGRST_DB_SCHEMAS=public,storage,graphql_public
DOCKER_SOCKET_LOCATION=/var/run/docker.sock
`;

  const howToUse = `

# ----------------------------------
# How to use (common commands)
# ----------------------------------
# 1) Start services in the background:
#    docker compose up -d
# 2) Watch logs for all services:
#    docker compose logs -f
# 3) Check running services:
#    docker compose ps
# 4) Stop and remove services:
#    docker compose down
# 5) Open a psql shell in the database:
#    docker compose exec db psql -U supabase_admin -d postgres
# 6) Run a SQL file against the DB (example):
#    docker compose exec -T db psql -U supabase_admin -d postgres -f /docker-entrypoint-initdb.d/init.sql
# 7) Seed data (example):
#    docker compose exec -T db psql -U supabase_admin -d postgres -c "INSERT INTO public.example(column) VALUES ('seed');"
#
# Next steps:
# - Point DNS to SITE_URL and configure HTTPS (e.g., via a reverse proxy).
# - Configure SMTP credentials (GOTRUE_SMTP_*).
# - Rotate and store secrets securely; do NOT commit this file.
# - Consider backups for the volumes directory.
`;

  const tips: string[] = [];
  const enable_vector = options?.enable_vector;
  const enable_logflare = options?.enable_logflare;
  if (enable_vector) {
    tips.push(
      `#
# Vector tips:
# - Vector service reads config from ./volumes/logs/vector.yml (mounted into the container).
# - Inspect running topology: docker compose exec vector vector validate --no-environment --config /etc/vector/vector.yml
# - Send logs to additional sinks by editing volumes/logs/vector.yml. Docs: https://vector.dev/docs/`
    );
  }
  if (enable_logflare) {
    tips.push(
      `#
# Logflare tips:
# - Open the UI at: http://localhost:4000 (or your mapped host port).
# - Set LOGFLARE_API_KEY in .env if required, and configure sources within Logflare.
# - Logflare in this stack uses Postgres as a backend for quick start.`
    );
  }

  const extras = tips.length ? `\n${tips.join('\n')}` : '';

  // Quote all env values safely: KEY="escaped"
  const quoteEnv = (content: string) => content.split('\n').map(line => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) return line;
    const key = m[1];
    const raw = m[2] ?? '';
    const trimmed = raw.trim();
    // Preserve existing quoted values as-is
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return `${key}=${trimmed}`;
    }
    const escaped = raw.replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
    return `${key}="${escaped}"`;
  }).join('\n');

  const content = `${base}${howToUse}${extras}`;
  return quoteEnv(content);
}