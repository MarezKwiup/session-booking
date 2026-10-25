import { Request, Response } from 'express';
import { env } from '../../config/env';
import * as sessionService from './session.service';

export async function createSession(_req: Request, res: Response) {
    const session = await sessionService.createSession(res.locals.body);
    res.status(201).json({ success: true, data: session });
}

export async function getAvailableSessions(_req: Request, res: Response) {
    const { dateTimestamp, timezone = env.DEFAULT_TIMEZONE } = res.locals.query;
    const sessions = await sessionService.getAvailableSessions(dateTimestamp, timezone);
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
}