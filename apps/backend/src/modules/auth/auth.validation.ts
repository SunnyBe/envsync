import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ error: 'email is required' })
    .trim()
    .email('Must be a valid email address')
    .max(254, 'Email too long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
