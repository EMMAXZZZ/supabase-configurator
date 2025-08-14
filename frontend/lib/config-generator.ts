// Re-export all generators from their respective modules
export { generateSecureSecret, generatePassword, generateJWT } from './generators/secrets';
export { generateEnvFile } from './generators/env';
export { generateDockerCompose } from './generators/docker-compose';

import type { GeneratedConfig } from './types';

/**
 * Generate docker-compose.override.yml for development
 */
export function generateDockerComposeOverride(config: GeneratedConfig): string {
  return `# Docker Compose override for development
# This file is automatically loaded by docker-compose
# and overrides settings in docker-compose.yml

services:
  studio:
    ports:
      - "3000:3000"
    environment:
      # Development-specific settings
      NODE_ENV: development
      
  kong:
    ports:
      - "8000:8000"
      - "8443:8443"
    
  db:
    ports:
      - "5432:5432"
    # Enable query logging in development
    command:
      - postgres
      - -c
      - config_file=/etc/postgresql/postgresql.conf
      - -c
      - log_statement=all
      - -c
      - log_min_duration_statement=0
      
  # Add development database seeding
  db-seed:
    image: supabase/postgres:15.1.0.147
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./volumes/db/seed:/docker-entrypoint-initdb.d/seed:Z
    command: >
      sh -c "
        echo 'Running development seeds...';
        psql -h db -U supabase_admin -d postgres -f /docker-entrypoint-initdb.d/seed/development.sql || true;
        echo 'Seed complete';
      "
    environment:
      PGPASSWORD: ${config.db_password}
    profiles:
      - seed
`;
}