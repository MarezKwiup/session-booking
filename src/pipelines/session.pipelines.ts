import { PipelineStage, Types } from "mongoose";
import { SessionStatus } from "../models/session.model";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Joins the teacher onto each session. */

export const teacherLookup: [PipelineStage.Lookup, PipelineStage.Unwind] = [
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

const sessionFields = {
    teacher: 1,
    startTime: 1,
    endTime: 1,
    status: 1,
    completedAt: 1,
    createdAt: 1
}

/** Joins one user's sessions in a given status, with teacher details. */
function userSessionsByStatus(
    status: SessionStatus,
    sort: Record<string, 1 | -1>,
    as: string
): PipelineStage.Lookup{
    return {
        $lookup: {
            from: 'sessions',
            localField: '_id',
            foreignField: 'userId',
            as,
            pipeline: [
                { $match: { status } },
                { $sort: sort },
                ...teacherLookup,
                { $project: sessionFields },
            ]
        }
    };
}

/** API 6: runs on the `users` collection, so one round trip both checks the  user exists (no result → 404) and returns their sessions split by status. */
export function userSessionsPipeline(userId: Types.ObjectId): PipelineStage[] {
    return [
        { $match: { _id: userId } },
        userSessionsByStatus(SessionStatus.BOOKED, { startTime: 1 }, 'upcomingSessions'),
        userSessionsByStatus(SessionStatus.COMPLETED, { completedAt: -1 }, 'completedSessions'),
        { 
            $project: {
                _id: 0,
                user: {
                    _id: '$_id',
                    fullName: '$fullName',
                    email: '$email',
                    phone: '$phone'
                },
                upcomingSessions: 1,
                completedSessions: 1,
                counts: {
                    upcoming: { $size: '$upcomingSessions' },
                    completed: { $size: '$completedSessions' }
                }
            }
        }
    ]
}