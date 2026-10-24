import { Request, Response } from "express";
import * as teacherService from './teacher.service';

export async function createTeacher(_req: Request, res: Response) {
    const teacher = await teacherService.createTeacher(res.locals.body);
    res.status(201).json({ success: true, data: teacher });
}