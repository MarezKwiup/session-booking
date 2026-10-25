import { Router } from 'express';
import teacherRoutes from './modules/teacher/teacher.routes';
import userRoutes from './modules/user/user.routes';
import sessionRoutes from './modules/session/session.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/teachers', teacherRoutes);
router.use('/sessions', sessionRoutes);

export default router;