import { UserModel } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { CreateUserInput } from "../../validators/user.validator";
import { Types } from 'mongoose';
import { userSessionsPipeline } from "../../pipelines/session.pipelines";

export async function createUser(input: CreateUserInput) {
    const exists = await UserModel.exists({ email: input.email });
    if (exists) throw ApiError.conflict('A user with this email already exists');

    return UserModel.create(input);
}

export async function getUserSessions(userId: string) {
    const [result] = await UserModel.aggregate(userSessionsPipeline(new Types.ObjectId(userId)));
    if (!result) throw ApiError.notFound('User not found');
    return result;
}