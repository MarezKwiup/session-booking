import { Schema, model, InferSchemaType } from 'mongoose';

export const SessionStatus = {
    AVAILABLE: 'AVAILABLE',
    BOOKED: 'BOOKED',
    COMPLETED: 'COMPLETED',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

const sessionSchema = new Schema(
    {
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: 'Teacher',
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: Object.values(SessionStatus),
            default: SessionStatus.AVAILABLE
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true, versionKey: false },
);

// GET /sessions/available → { status, startTime range }
sessionSchema.index({ status: 1, startTime: 1 });
// GET /users/:id/sessions → { userId, status }
sessionSchema.index({ userId: 1, status: 1});
// POST /sessions overlap check → { teacherId, startTime/endTime range }
sessionSchema.index({ teacherId: 1, startTime: 1 });

export type Session = InferSchemaType<typeof sessionSchema>;
export const SessionModel = model('Session', sessionSchema);