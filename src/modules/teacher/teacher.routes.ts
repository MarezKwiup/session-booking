import { Router } from "express";
import * as teacherController from './teacher.controller';
import { validate } from "../../middlewares/validate";
import { createTeacherSchema } from "../../validators/teacher.validator";

const router = Router();

router.post('/', validate({ body: createTeacherSchema }), teacherController.createTeacher);

export default router;