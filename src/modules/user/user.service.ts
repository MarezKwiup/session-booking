import { UserModel } from "../../models/user.model";
import { ApiError } from "../../utils/ApiError";
import { CreateUserInput } from "../../validators/user.validator";

export async function createUser(input: CreateUserInput) {
    const exists = await UserModel.exists({ email: input.email });
    if (exists) throw ApiError.conflict('A user with this email already exists');

    return UserModel.create(input);
}