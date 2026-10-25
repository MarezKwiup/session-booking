import { SessionModel } from "../../models/session.model";
import { TeacherModel } from "../../models/teacher.model";
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