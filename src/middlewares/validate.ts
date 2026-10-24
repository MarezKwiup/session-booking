import { RequestHandler } from "express";
import { z } from 'zod';
import { ApiError } from "../utils/ApiError";

type Schemas = {
    body?: z.ZodType;
    params?: z.ZodType;
    query?: z.ZodType;
}

export const validate =
    (schemas: Schemas): RequestHandler =>
    (req, res, next) => {
        const issues: { location: string; field: string; message: string}[] = [];

        for (const location of ['params', 'query', 'body'] as const) {
            const schema = schemas[location];
            if (!schema) continue;

            const result = schema.safeParse(req[location] ?? {});
            if (result.success) {
                res.locals[location] = result.data;
            } else {
                for (const issue of result.error.issues) {
                    issues.push({ 
                        location,
                        field: issue.path.join('.'),
                        message: issue.message
                    });
                }
            }
        }

        if (issues.length) {
            return next(ApiError.badRequest('Validation failed: ', issues));
        }
        next();
    };