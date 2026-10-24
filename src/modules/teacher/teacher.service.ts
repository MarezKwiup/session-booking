import { TeacherModel } from "../../models/teacher.model";
import { ApiError } from "../../utils/ApiError";
import { createTeacherInput } from "../../validators/teacher.validator";

export async function createTeacher(input: createTeacherInput) {
    const exists = await TeacherModel.exists({ email: input.email });
    if (exists) throw ApiError.conflict('A teacher with this email already exists');

    return TeacherModel.create(input);
}