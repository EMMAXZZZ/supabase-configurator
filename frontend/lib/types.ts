export interface ConfigFormData {
  project_name: string;
  domain: string;
  email: string;
  db_password?: string;
  jwt_secret?: string;
  anon_key?: string;
  service_key?: string;
  enable_dev_override?: boolean;
  canonical_url?: string;
  enable_vector?: boolean;
  enable_logflare?: boolean;
  enable_pgvector?: boolean;
}

export interface GeneratedConfig {
  project_name: string;
  domain: string;
  email: string;
  db_password: string;
  jwt_secret: string;
  anon_key: string;
  service_key: string;
}

export interface DeploymentData {
  vpsHost: string;
  vpsUser: string;
  vpsPort: number;
  vpsPassword: string;
  domainName?: string;
  sslEmail?: string;
  remotePath: string;
  includeOverride?: boolean;
  runDockerUp?: boolean;
  // New destructive confirmation guards
  confirmDestructive?: boolean;
  confirmPhrase?: string;
  overrideContent?: string;
  envContent: string;
  composeContent: string;
}
export interface GenerateResponse {
  envContent: string;
  composeContent: string;
  overrideContent: string;
  pgvectorSqlContent?: string;
  vectorConfigContent?: string;
  config: GeneratedConfig;
}

export interface DeployResponse {
  success: boolean;
  message: string;
  steps?: DeploymentStep[];
}

export interface DeploymentStep {
  step: number;
  message: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  details?: string;
}

export interface DeploymentFormData {
  vpsHost: string;
  vpsUser: string;
  vpsPort: number;
  vpsPassword: string;
  domainName: string;
  sslEmail: string;
  remotePath: string;
  includeOverride: boolean;
  runDockerUp: boolean;
  confirmDestructive: boolean;
  confirmPhrase: string;
}
