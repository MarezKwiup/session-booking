import { Router } from "express";
import * as userController from './user.controller';
import { validate } from "../../middlewares/validate";
import { createUserSchema } from "../../validators/user.validator";
import { idParam } from "../../validators/common";

const router = Router();

router.post('/', validate({ body: createUserSchema }), userController.createUser);
router.get('/:id/sessions', validate({ params: idParam}), userController.getUserSessions);

export default router;