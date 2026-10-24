import { Router } from 'express';
import teacherRoutes from './modules/teacher/teacher.routes';
import userRoutes from './modules/user/user.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/teachers', teacherRoutes);

export default router;