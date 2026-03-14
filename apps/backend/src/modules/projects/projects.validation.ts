import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string({ error: 'name is required' })
    .trim()
    .min(1, 'name cannot be empty')
    .max(100, 'name cannot exceed 100 characters')
    .regex(/^[\w\-. ]+$/, 'name can only contain letters, numbers, hyphens, dots, and spaces'),
});
