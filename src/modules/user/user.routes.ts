import { Router } from "express";
import * as userController from './user.controller';
import { validate } from "../../middlewares/validate";
import { createUserSchema } from "../../validators/user.validator";

const router = Router();

router.post('/', validate({ body: createUserSchema }), userController.createUser);

export default router;