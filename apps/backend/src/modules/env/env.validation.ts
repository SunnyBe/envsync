import { z } from 'zod';

const SUPPORTED_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

export const pushEnvSchema = z.object({
  env: z.enum(SUPPORTED_ENVIRONMENTS, {
    error: 'env must be one of: development, staging, production',
  }),
  variables: z
    .record(z.string(), z.string({ error: 'variable values must be strings' }))
    .refine((vars) => Object.keys(vars).length > 0, { message: 'variables cannot be empty' })
    .refine((vars) => Object.keys(vars).length <= 100, {
      message: 'cannot push more than 100 variables at once',
    }),
});

export const pullEnvSchema = z.object({
  env: z.enum(SUPPORTED_ENVIRONMENTS, {
    error: 'env must be one of: development, staging, production',
  }),
  projectId: z.string().uuid('projectId must be a valid UUID'),
});
