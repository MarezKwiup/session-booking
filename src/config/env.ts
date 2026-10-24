import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export function isValidTimezone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    DEFAULT_TIMEZONE: z
        .string()
        .default('UTC')
        .refine(isValidTimezone, 'DEFAULT_TIMEZONE must be a valid IANA timezone'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment configuration: ', z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
}

export const env = parsed.data;