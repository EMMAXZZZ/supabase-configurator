/**
 * Configuration generators for Supabase Configurator
 * Contains functions to generate .env, docker-compose.yml, and deployment scripts
 */

import { generateSecureSecret, cleanDomain } from './utils.mjs';

/**
 * Generate .env file content with all Supabase environment variables
 * @param {object} config - Configuration object
 * @returns {string} Complete .env file content
 */
export function generateEnvFile(config) {
    // Clean domain for environment variables
    const cleanedDomain = cleanDomain(config.domain);
    
    return `# Supabase Configuration
# Generated on ${new Date().toISOString()}
# Project: ${config.project_name}

############
# GENERAL
############
STUDIO_PORT=3000
SITE_URL=https://${cleanedDomain}
ADDITIONAL_REDIRECT_URLS=""
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=https://${cleanedDomain}

############
# DATABASE
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_USER=supabase_admin
POSTGRES_PASSWORD=${config.db_password}
# URL-encoded variant for safe use in connection strings
POSTGRES_PASSWORD_URLENC=${encodeURIComponent(config.db_password)}
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
# FUNCTIONS
############
FUNCTIONS_VERIFY_JWT=false

############
# LOGS
############
LOGFLARE_API_KEY=${generateSecureSecret(32)}
LOGFLARE_URL=http://analytics:4000
NEXT_ANALYTICS_BACKEND_PROVIDER=postgres

############
# REALTIME
############
REALTIME_DB_ENC_KEY=supabaserealtimedev
REALTIME_SECRET_KEY_BASE=${generateSecureSecret(64)}`;
}

/**
 * Generate deployment script for VPS deployment
 * @param {object} params - Deployment parameters
 * @returns {string} Complete bash deployment script
 */
export function generateDeploymentScript({ vpsHost, vpsUser, vpsPort, domainName, sslEmail, envContent, composeContent }) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    return `#!/bin/bash
# Automated Supabase Deployment Script
# Generated on ${new Date().toISOString()}
# Target: ${vpsUser}@${vpsHost}:${vpsPort}

set -e

echo "🚀 Starting Supabase deployment on ${vpsHost}..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🐙 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create supabase directory
echo "📁 Creating deployment directory..."
mkdir -p ~/supabase
cd ~/supabase

# Create volumes directories
echo "📂 Setting up volume directories..."
mkdir -p volumes/{api,db,logs,storage,functions}
chmod -R 755 volumes/

# Write environment file
echo "📄 Creating .env file..."
cat << 'EOF' > .env
${envContent.replace(/\$/g, '\\$')}
EOF

# Write docker-compose file
echo "🐳 Creating docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
${composeContent.replace(/\$/g, '\\$')}
EOF

# Create required configuration files
echo "⚙️  Creating configuration files..."

# Kong configuration
cat << 'EOF' > volumes/api/kong.yml
_format_version: "2.1"

consumers:
  - username: anon
    keyauth_credentials:
      - key: anon
  - username: service_role
    keyauth_credentials:
      - key: service_role

acls:
  - consumer: anon
    group: anon
  - consumer: service_role
    group: admin

services:
  - name: auth-v1-open
    url: http://auth:9999/verify
    routes:
      - name: auth-v1-open
        strip_path: true
        paths:
          - "/auth/v1/verify"
    plugins:
      - name: cors

  - name: auth-v1-open-callback
    url: http://auth:9999/callback
    routes:
      - name: auth-v1-open-callback
        strip_path: true
        paths:
          - "/auth/v1/callback"
    plugins:
      - name: cors

  - name: auth-v1-open-authorize
    url: http://auth:9999/authorize
    routes:
      - name: auth-v1-open-authorize
        strip_path: true
        paths:
          - "/auth/v1/authorize"
    plugins:
      - name: cors

  - name: auth-v1
    _comment: "GoTrue: /auth/v1/* -> http://auth:9999/*"
    url: http://auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - "/auth/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: rest-v1
    _comment: "PostgREST: /rest/v1/* -> http://rest:3000/*"
    url: http://rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - "/rest/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: true
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: realtime-v1
    _comment: "Realtime: /realtime/v1/* -> ws://realtime:4000/socket/*"
    url: http://realtime:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - "/realtime/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: storage-v1
    _comment: "Storage: /storage/v1/* -> http://storage:5000/*"
    url: http://storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - "/storage/v1/"
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon
EOF

# Vector logging configuration
cat << 'EOF' > volumes/logs/vector.yml
data_dir: "/var/lib/vector/"

sources:
  docker_logs:
    type: "docker_logs"
    include_images:
      - "supabase/*"
    exclude_labels:
      - "vector.exclude"

transforms:
  parse_logs:
    type: "remap"
    inputs: ["docker_logs"]
    source: |
      .timestamp = now()
      .level = "info"
      if exists(.message) {
        .message = string!(.message)
      }

sinks:
  console:
    type: "console"
    inputs: ["parse_logs"]
    encoding:
      codec: "json"
  
  file:
    type: "file"
    inputs: ["parse_logs"]
    path: "/var/log/supabase-%Y-%m-%d.log"
    encoding:
      codec: "json"
EOF

# Database initialization scripts
cat << 'EOF' > volumes/db/roles.sql
CREATE ROLE anon NOINHERIT;
CREATE ROLE authenticated NOINHERIT;
CREATE ROLE service_role NOINHERIT BYPASSRLS;
CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE CREATEDB REPLICATION;
CREATE ROLE supabase_storage_admin NOINHERIT CREATEDB CREATEROLE;
CREATE ROLE supabase_realtime_admin;
CREATE ROLE dashboard_user NOSUPERUSER CREATEDB CREATEROLE REPLICATION;
CREATE ROLE authenticator NOINHERIT;

GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_auth_admin TO authenticator;
EOF

cat << 'EOF' > volumes/db/jwt.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
  LANGUAGE sql STABLE
  AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim', true),
    current_setting('request.jwt.claims', true)
  )::jsonb
$$;

GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.jwt() TO PUBLIC;
EOF

# Set DOCKER_SOCKET_LOCATION environment variable
echo "DOCKER_SOCKET_LOCATION=/var/run/docker.sock" >> .env

# Install UFW firewall if not present and configure
if ! command -v ufw &> /dev/null; then
    echo "🔥 Installing UFW firewall..."
    sudo apt install -y ufw
fi

echo "🛡️  Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # Supabase Studio
sudo ufw allow 8000  # Kong API Gateway
sudo ufw allow 5432  # PostgreSQL (if remote access needed)

# Install Nginx if domain is provided
${domainName ? `
echo "🌐 Installing and configuring Nginx..."
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/supabase << 'NGINX_EOF'
server {
    listen 80;
    server_name ${domainName};
    return 301 https://\\$server_name\\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domainName};

    # SSL certificates will be configured by certbot
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }
}
NGINX_EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
echo "🔒 Obtaining SSL certificate..."
sudo certbot --nginx -d ${domainName} --non-interactive --agree-tos --email ${sslEmail}

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
` : ''}

# Pull Docker images
echo "📥 Pulling Docker images..."
docker-compose pull

# Start services
echo "🚀 Starting Supabase services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Supabase deployment completed successfully!"
echo ""
echo "📊 Access Information:"
echo "   Studio Dashboard: ${domainName ? `https://${domainName}` : `http://${vpsHost}:3000`}"
echo "   API Endpoint: ${domainName ? `https://${domainName}/api` : `http://${vpsHost}:8000`}"
echo "   Database: ${vpsHost}:5432"
echo ""
echo "📝 Next Steps:"
echo "   1. Update SMTP settings in .env file"
echo "   2. Configure your application to use the API endpoint"
echo "   3. Set up monitoring and backups"
echo "   4. Review firewall settings"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: docker-compose logs -f [service_name]"
echo "   Restart services: docker-compose restart"
echo "   Stop services: docker-compose down"
echo "   Update: docker-compose pull && docker-compose up -d"
echo ""
`;
}

/**
 * Generate docker-compose.yml configuration
 * @param {object} config - Configuration object
 * @returns {string} Complete docker-compose.yml content
 */
export function generateDockerCompose(config) {
    return `# Supabase Docker Compose Configuration
# Generated on ${new Date().toISOString()}
# Project: ${config.project_name}

version: "3.8"

services:
  studio:
    container_name: supabase-studio
    image: supabase/studio:20240326-5e5586d
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/profile', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      timeout: 5s
      interval: 5s
      retries: 3
    ports:
      - "\\$\{STUDIO_PORT:-3000}:3000/tcp"
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PASSWORD: \\$\{POSTGRES_PASSWORD}
      DEFAULT_ORGANIZATION_NAME: \\$\{STUDIO_DEFAULT_ORGANIZATION:-Default Organization}
      DEFAULT_PROJECT_NAME: \\$\{STUDIO_DEFAULT_PROJECT:-Default Project}
      SUPABASE_URL: http://kong:8000
      SUPABASE_PUBLIC_URL: \\$\{API_EXTERNAL_URL}
      SUPABASE_ANON_KEY: \\$\{ANON_KEY}
      SUPABASE_SERVICE_KEY: \\$\{SERVICE_ROLE_KEY}
      LOGFLARE_API_KEY: \\$\{LOGFLARE_API_KEY}
      LOGFLARE_URL: \\$\{LOGFLARE_URL}
      NEXT_PUBLIC_ENABLE_LOGS: true
      NEXT_ANALYTICS_BACKEND_PROVIDER: postgres

  kong:
    container_name: supabase-kong
    image: kong:2.8.1
    restart: unless-stopped
    ports:
      - "\\$\{KONG_HTTP_PORT:-8000}:8000/tcp"
      - "\\$\{KONG_HTTPS_PORT:-8443}:8443/tcp"
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
      KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: 160k
      KONG_NGINX_PROXY_PROXY_BUFFERS: 64 160k
    volumes:
      - ./volumes/api/kong.yml:/var/lib/kong/kong.yml:ro

  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.143.0
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9999/health"]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: \\$\{API_EXTERNAL_URL}
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:\\$\{POSTGRES_PASSWORD_URLENC}@\\$\{POSTGRES_HOST}:\\$\{POSTGRES_PORT}/\\$\{POSTGRES_DB}
      GOTRUE_SITE_URL: \\$\{SITE_URL}
      GOTRUE_URI_ALLOW_LIST: \\$\{ADDITIONAL_REDIRECT_URLS}
      GOTRUE_DISABLE_SIGNUP: \\$\{DISABLE_SIGNUP}
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: \\$\{JWT_EXPIRY}
      GOTRUE_JWT_SECRET: \\$\{JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: \\$\{GOTRUE_EXTERNAL_EMAIL_ENABLED}
      GOTRUE_MAILER_AUTOCONFIRM: \\$\{GOTRUE_MAILER_AUTOCONFIRM}
      GOTRUE_SMTP_ADMIN_EMAIL: \\$\{GOTRUE_SMTP_ADMIN_EMAIL}
      GOTRUE_SMTP_HOST: \\$\{GOTRUE_SMTP_HOST}
      GOTRUE_SMTP_PORT: \\$\{GOTRUE_SMTP_PORT}
      GOTRUE_SMTP_USER: \\$\{GOTRUE_SMTP_USER}
      GOTRUE_SMTP_PASS: \\$\{GOTRUE_SMTP_PASS}
      GOTRUE_SMTP_SENDER_NAME: \\$\{GOTRUE_SMTP_SENDER_NAME}
      GOTRUE_MAILER_URLPATHS_INVITE: \\$\{MAILER_URLPATHS_INVITE}
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: \\$\{MAILER_URLPATHS_CONFIRMATION}
      GOTRUE_MAILER_URLPATHS_RECOVERY: \\$\{MAILER_URLPATHS_RECOVERY}
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: \\$\{MAILER_URLPATHS_EMAIL_CHANGE}

  rest:
    container_name: supabase-rest
    image: postgrest/postgrest:v12.0.1
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://authenticator:\\$\{POSTGRES_PASSWORD_URLENC}@\\$\{POSTGRES_HOST}:\\$\{POSTGRES_PORT}/\\$\{POSTGRES_DB}
      PGRST_DB_SCHEMAS: \\$\{PGRST_DB_SCHEMAS}
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: \\$\{JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
      PGRST_APP_SETTINGS_JWT_SECRET: \\$\{JWT_SECRET}
      PGRST_APP_SETTINGS_JWT_EXP: \\$\{JWT_EXPIRY}
    command: "postgrest"

  realtime:
    container_name: supabase-realtime
    image: supabase/realtime:v2.27.5
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "bash", "-c", "printf \"GET /api/health HTTP/1.1\\r\\n\\r\\n\" | nc 127.0.0.1 4000"]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      PORT: 4000
      DB_HOST: \\$\{POSTGRES_HOST}
      DB_PORT: \\$\{POSTGRES_PORT}
      DB_USER: supabase_realtime_admin
      DB_PASSWORD: \\$\{POSTGRES_PASSWORD}
      DB_NAME: \\$\{POSTGRES_DB}
      DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime'
      DB_ENC_KEY: \\$\{REALTIME_DB_ENC_KEY:-supabaserealtimedev}
      API_JWT_SECRET: \\$\{JWT_SECRET}
      FLY_ALLOC_ID: fly123
      FLY_APP_NAME: realtime
      SECRET_KEY_BASE: \\$\{REALTIME_SECRET_KEY_BASE}
      ERL_AFLAGS: -proto_dist inet_tcp
      ENABLE_TAILSCALE: "false"
      DNS_NODES: "''"
    command: >
      sh -c "/app/bin/migrate && /app/bin/realtime eval 'Realtime.Release.seeds(Realtime.Repo)' && /app/bin/server"

  storage:
    container_name: supabase-storage
    image: supabase/storage-api:v1.0.6
    depends_on:
      db:
        condition: service_healthy
      rest:
        condition: service_started
      imgproxy:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/status"]
      timeout: 5s
      interval: 5s
      retries: 3
    restart: unless-stopped
    environment:
      ANON_KEY: \\$\{ANON_KEY}
      SERVICE_KEY: \\$\{SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: \\$\{JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:\\$\{POSTGRES_PASSWORD_URLENC}@\\$\{POSTGRES_HOST}:\\$\{POSTGRES_PORT}/\\$\{POSTGRES_DB}
      FILE_SIZE_LIMIT: \\$\{STORAGE_FILE_SIZE_LIMIT}
      STORAGE_BACKEND: \\$\{STORAGE_BACKEND}
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: \\$\{STORAGE_S3_REGION}
      GLOBAL_S3_BUCKET: \\$\{STORAGE_S3_BUCKET}
      ENABLE_IMAGE_TRANSFORMATION: "true"
      IMGPROXY_URL: http://imgproxy:5001
    volumes:
      - ./volumes/storage:/var/lib/storage:z

  imgproxy:
    container_name: supabase-imgproxy
    image: darthsim/imgproxy:v3.8.0
    healthcheck:
      test: ["CMD", "imgproxy", "health"]
      timeout: 5s
      interval: 5s
      retries: 3
    environment:
      IMGPROXY_BIND: ":5001"
      IMGPROXY_LOCAL_FILESYSTEM_ROOT: /
      IMGPROXY_USE_ETAG: "true"
      IMGPROXY_ENABLE_WEBP_DETECTION: \\$\{IMGPROXY_ENABLE_WEBP_DETECTION}
    volumes:
      - ./volumes/storage:/var/lib/storage:z

  meta:
    container_name: supabase-meta
    image: supabase/postgres-meta:v0.80.0
    depends_on:
      db:
        condition: service_healthy
      analytics:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: \\$\{POSTGRES_HOST}
      PG_META_DB_PORT: \\$\{POSTGRES_PORT}
      PG_META_DB_NAME: \\$\{POSTGRES_DB}
      PG_META_DB_USER: supabase_admin
      PG_META_DB_PASSWORD: \\$\{POSTGRES_PASSWORD}

  functions:
    container_name: supabase-edge-functions
    image: supabase/edge-runtime:v1.45.2
    restart: unless-stopped
    depends_on:
      analytics:
        condition: service_healthy
    environment:
      JWT_SECRET: \\$\{JWT_SECRET}
      SUPABASE_URL: http://kong:8000
      SUPABASE_ANON_KEY: \\$\{ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: \\$\{SERVICE_ROLE_KEY}
      SUPABASE_DB_URL: postgresql://postgres:\\$\{POSTGRES_PASSWORD_URLENC}@\\$\{POSTGRES_HOST}:\\$\{POSTGRES_PORT}/\\$\{POSTGRES_DB}
      VERIFY_JWT: \\$\{FUNCTIONS_VERIFY_JWT}
    volumes:
      - ./volumes/functions:/home/deno/functions:Z
    command:
      - start
      - --main-service
      - /home/deno/functions/main

  analytics:
    container_name: supabase-analytics
    image: supabase/logflare:1.4.0
    healthcheck:
      test: ["CMD", "curl", "http://localhost:4000/health"]
      timeout: 5s
      interval: 5s
      retries: 10
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      LOGFLARE_NODE_HOST: 127.0.0.1
      DB_USERNAME: supabase_admin
      DB_DATABASE: \\$\{POSTGRES_DB}
      DB_HOSTNAME: \\$\{POSTGRES_HOST}
      DB_PORT: \\$\{POSTGRES_PORT}
      DB_PASSWORD: \\$\{POSTGRES_PASSWORD}
      DB_SCHEMA: _analytics
      LOGFLARE_API_KEY: \\$\{LOGFLARE_API_KEY}
      LOGFLARE_SINGLE_TENANT: true
      LOGFLARE_SUPABASE_MODE: true
      LOGFLARE_MIN_CLUSTER_SIZE: 1
      RELEASE_COOKIE: cookie

  db:
    container_name: supabase-db
    image: supabase/postgres:15.1.0.147
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -h localhost"]
      timeout: 5s
      interval: 5s
      retries: 10
    depends_on:
      vector:
        condition: service_healthy
    command:
      - postgres
      - -c
      - config_file=/etc/postgresql/postgresql.conf
      - -c
      - log_min_messages=fatal
    restart: unless-stopped
    ports:
      - "\\$\{POSTGRES_PORT:-5432}:5432"
    environment:
      POSTGRES_HOST: /var/run/postgresql
      PGPORT: \\$\{POSTGRES_PORT}
      POSTGRES_PORT: \\$\{POSTGRES_PORT}
      PGPASSWORD: \\$\{POSTGRES_PASSWORD}
      POSTGRES_PASSWORD: \\$\{POSTGRES_PASSWORD}
      PGDATABASE: \\$\{POSTGRES_DB}
      POSTGRES_DB: \\$\{POSTGRES_DB}
      JWT_SECRET: \\$\{JWT_SECRET}
      JWT_EXP: \\$\{JWT_EXPIRY}
    volumes:
      - ./volumes/db/realtime.sql:/docker-entrypoint-initdb.d/migrations/99-realtime.sql:Z
      - ./volumes/db/webhooks.sql:/docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql:Z
      - ./volumes/db/roles.sql:/docker-entrypoint-initdb.d/init-scripts/99-roles.sql:Z
      - ./volumes/db/jwt.sql:/docker-entrypoint-initdb.d/init-scripts/99-jwt.sql:Z
      - ./volumes/db/logs.sql:/docker-entrypoint-initdb.d/migrations/99-logs.sql:Z
      - supabase_db_data:/var/lib/postgresql/data:Z
      - ./volumes/db/init:/docker-entrypoint-initdb.d:Z

  vector:
    container_name: supabase-vector
    image: timberio/vector:0.28.1-alpine
    healthcheck:
      test: ["CMD", "vector", "--version"]
      timeout: 5s
      interval: 5s
      retries: 3
    volumes:
      - ./volumes/logs/vector.yml:/etc/vector/vector.yml:ro
      - \\$\{DOCKER_SOCKET_LOCATION}:/var/run/docker.sock:ro
    command: ["--config", "etc/vector/vector.yml"]

volumes:
  supabase_db_data:
`;
}