import { z } from 'zod';

export const createTeacherSchema = z.object({
    fullName: z.string().trim().min(1, 'fullName is required'),
    email: z.email('Invalid email').trim().toLowerCase(),
    specialization: z.string().trim().min(1, 'specialization is required'),
    experience: z.number().int().min(0, 'experience must be >= 0'),
});

export type createTeacherInput = z.infer<typeof createTeacherSchema>;
