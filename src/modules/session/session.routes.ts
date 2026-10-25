import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { availableSessionQuery, createSessionSchema } from "../../validators/session.validators";
import * as sessionController from './session.controller';

const router = Router();

router.post('/', validate({ body: createSessionSchema }), sessionController.createSession);
router.get('/available', validate({ query: availableSessionQuery }), sessionController.getAvailableSessions);

export default router;
