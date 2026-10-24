import { z } from 'zod';

export const createUserSchema = z.object({
    fullName: z.string().trim().min(1, 'fullName is required'),
    email: z.email('Invalid email').trim().toLowerCase(),
    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9\s-]{7,20}$/, 'Invalid phone number'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;