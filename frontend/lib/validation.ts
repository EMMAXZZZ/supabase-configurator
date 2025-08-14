import { z } from 'zod';

export const ConfigFormSchema = z.object({
  project_name: z
    .string()
    .min(1, 'Project name is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric, hyphens, and underscores allowed'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .refine((val) => {
      const cleanDomain = val.replace(/^https?:\/\//, '').replace(/\/$/, '');
      return /^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(cleanDomain) ||
             /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(cleanDomain);
    }, 'Please provide a valid domain name or URL'),
  email: z.string().email('Please provide a valid email address'),
  db_password: z.string().optional(),
  jwt_secret: z.string().optional(),
  anon_key: z.string().optional(),
  service_key: z.string().optional(),
  enable_dev_override: z.boolean().optional().default(false),
  canonical_url: z.string().url('Must be a valid URL starting with http(s)://').optional(),
  enable_vector: z.boolean().optional().default(false),
  enable_logflare: z.boolean().optional().default(false),
  enable_pgvector: z.boolean().optional().default(false),
});

export const DeploymentSchema = z.object({
  vpsHost: z.string().min(1, 'VPS host is required'),
  vpsUser: z.string().min(1, 'SSH username is required'),
  vpsPort: z.number().min(1).max(65535, 'Invalid port number'),
  vpsPassword: z.string().min(1, 'SSH password is required'),
  domainName: z.string().optional(),
  sslEmail: z.string().email().optional(),
  remotePath: z.string().min(1, 'Remote path is required'),
  includeOverride: z.boolean().optional().default(false),
  runDockerUp: z.boolean().optional().default(false),
  // Destructive confirmation
  confirmDestructive: z.boolean().refine(v => v === true, { message: 'You must acknowledge this is destructive.' }),
  confirmPhrase: z.string().min(1, 'Type DEPLOY to confirm').refine(v => v.toUpperCase() === 'DEPLOY', {
    message: 'Confirmation phrase must be exactly DEPLOY',
  }),
  overrideContent: z.string().optional(),
  envContent: z.string().min(1, 'Environment content is required'),
  composeContent: z.string().min(1, 'Docker compose content is required'),
}).refine((data) => !data.includeOverride || !!data.overrideContent, {
  message: 'Override content is required when includeOverride is enabled',
  path: ['overrideContent'],
});
export type ConfigFormInput = z.infer<typeof ConfigFormSchema>;
export type DeploymentInput = z.infer<typeof DeploymentSchema>;
