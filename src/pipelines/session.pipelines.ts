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
    return [
        // 1. index backed filter on [status, startTime] local day lies within 24 hrs
        {
            $match: {
                status: SessionStatus.AVAILABLE,
                startTime: {
                    $gte: new Date(date.getTime() - DAY_MS),
                    $lte: new Date(date.getTime() + DAY_MS),
                },
            },
        },
        // 2. session's start falls on same calenday day.
        {
            $match: {
                $expr: {
                    $eq: [
                        { $dateTrunc: { date: '$startTime', unit: 'day', timezone } },
                        { $dateTrunc: { date, unit: 'day', timezone } },
                    ]
                }
            }
        },
        // 3. Chronological order for a UI.
        { $sort: { startTime: 1 } },
        // 4. Join teacher details
        ...teacherLookup,
        // 5. Response shape
        {
            $project: {
                teacher: 1,
                startTime: 1,
                endTime: 1,
                status: 1,
                createdAt: 1,
            }
        }
    ];
}