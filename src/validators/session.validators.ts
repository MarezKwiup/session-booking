import { z } from 'zod';
import { isValidTimezone } from '../config/env';
import { dateInput, objectId } from './common';

export const createSessionSchema = z
    .object({
        teacherId: objectId,
        startTime: dateInput,
        endTime: dateInput
    })
    .refine((s) => s.endTime > s.startTime, {
        message: 'endTime must be greate than startTime',
        path: ['endTime']
    });

export const availableSessionQuery = z.object({
    dateTimestamp: dateInput,
    timezone: z.string().refine(isValidTimezone, 'Invalid IANA timezone').optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;