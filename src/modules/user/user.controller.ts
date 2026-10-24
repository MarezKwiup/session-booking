import { Request, Response } from "express";
import * as userService from './user.service';

export async function createUser(_req: Request, res: Response) {
    const user = await userService.createUser(res.locals.body);
    res.status(201).json({ success: true, data: user });
}