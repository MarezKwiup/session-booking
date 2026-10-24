import { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { env } from '../config/env';
import { ApiError } from "../utils/ApiError";
import { success } from "zod";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let details: unknown;

    if (err instanceof ApiError) {
        ({ statusCode, message, details } = err);
    } else if (err instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = 'Validation failed';
        details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    } else if (err instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid value for ${err.path}`;
    } else if (err?.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
        message = `A record with this ${field} already exists`;
    } else if (err?.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Malformed JSON body';
    } else if (err?.expose && typeof err.statusCode === 'number') {
        statusCode = err.status;
        message = err.message;
    }

    if (statusCode >= 500) console.error(err);

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(details !== undefined && { details }),
            ...(statusCode >= 500 && env.NODE_ENV === 'development' && { stack: err?.stack }),
        },
    });
};