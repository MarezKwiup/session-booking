import { SessionModel, SessionStatus } from "../../models/session.model";
import { TeacherModel } from "../../models/teacher.model";
import { UserModel } from "../../models/user.model";
import { availableSessionsPipeline } from "../../pipelines/session.pipelines";
import { ApiError } from "../../utils/ApiError";
import { CreateSessionInput } from "../../validators/session.validators";

export async function createSession({ teacherId, startTime, endTime }: CreateSessionInput) {
    const teacherExists = await TeacherModel.exists({ _id: teacherId });
    if (!teacherExists) throw ApiError.notFound('Teacher not found');

    // Overlap check
    const overlapping = await SessionModel.exists({
        teacherId,
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
    });
    if (overlapping) {
        throw ApiError.conflict('Teacher already has a session overlapping this time slot');
    }

    return SessionModel.create({ teacherId, startTime, endTime });
}

export async function getAvailableSessions(date: Date, timezone: string) {
    return SessionModel.aggregate(availableSessionsPipeline(date, timezone));
}

async function explainFailedTransition(sessionId: string, rule: string): Promise<ApiError> {
    const session = await SessionModel.findById(sessionId).select('status').lean();
    if (!session) return ApiError.notFound('Session not found');
    return ApiError.conflict(`${rule}. Current status: ${session.status}`);
}

export async function bookSession(sessionId: string, userId: string) {
    const userExists = await UserModel.exists({ _id: userId });
    if (!userExists) throw ApiError.notFound('User not found');

    // Check and write in a single atomic operation to prevent race conditions.
    const booked = await SessionModel.findOneAndUpdate(
        { _id: sessionId, status: SessionStatus.AVAILABLE, userId: null },
        { $set: { status: SessionStatus.BOOKED, userId }},
        { returnDocument: 'after' }
    ).lean();

    if (booked) return booked;
    throw await explainFailedTransition(sessionId, 'Only BOOKED sessions can be marked as completed');
}

export async function completeSession(sessionId: string) {
    const completed = await SessionModel.findOneAndUpdate(
        { _id: sessionId, status: SessionStatus.BOOKED },
        { $set: { status: SessionStatus.COMPLETED, completedAt: new Date() } },
        { returnDocument: 'after' },
    ).lean();

    if (completed) return completed;
    throw await explainFailedTransition(sessionId, 'Only BOOKED sessions can be marked as completed');
}

