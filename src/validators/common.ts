import { Types } from 'mongoose';
import { z } from 'zod';

export const objectId = z
    .string()
    .refine((v) => /^[a-f\d]{24}$/i.test(v) && Types.ObjectId.isValid(v), 'Invalid ObjectId');

export const idParam = z.object({ id: objectId });

/** Accepts an ISO-8601 string or a Unix timestamp (seconds or milliseconds) and outputs a Date. */
export const dateInput = z.union([z.number(), z.string().min(1)]).transform((v, ctx) => {
    const date = toDate(v);
    if (!date) {
        ctx.addIssue({ code: 'custom', message: 'Invalid date/timestamp' });
        return z.NEVER;
    }
    return date;
})

function toDate(v: number | string): Date | null {
    const numeric = typeof v === 'number' ? v : /^\d+$/.test(v) ? Number(v) : null;
    const date = 
        numeric !== null ? new Date(numeric < 1e12 ? numeric * 1000 : numeric) : new Date(v);
    return Number.isNaN(date.getTime()) ? null : date;
}