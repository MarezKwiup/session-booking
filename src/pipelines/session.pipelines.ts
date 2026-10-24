import { PipelineStage } from "mongoose";
import { SessionStatus } from "../models/session.model";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Joins the teacher onto each session. */

export const teacherLookup: PipelineStage[] = [
    {
        $lookup: {
            from: 'teachers',
            localField: 'teacherId',
            foreignField: '_id',
            as: 'teacher',
            pipeline: [{ $project: { fullName: 1, email: 1, specialization: 1, experience: 1 } }],
        }
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
];

/** AVAILABLE sessions that start on the calendar day (in `timezone`) containing `date`. */

export function availableSessionsPipeline(date: Date, timezone: string): PipelineStage[] {
    return [];
}