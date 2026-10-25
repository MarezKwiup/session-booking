import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { availableSessionQuery, bookSessionSchema, createSessionSchema } from "../../validators/session.validators";
import * as sessionController from './session.controller';
import { idParam } from "../../validators/common";

const router = Router();

router.post('/', validate({ body: createSessionSchema }), sessionController.createSession);
router.get('/available', validate({ query: availableSessionQuery }), sessionController.getAvailableSessions);
router.post('/:id/book', validate({ params: idParam, body: bookSessionSchema }), sessionController.bookSession);
router.patch('/:id/complete', validate({ params: idParam }), sessionController.completeSession);

export default router;
