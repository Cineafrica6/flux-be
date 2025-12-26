import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorMiddleware = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error(`${req.method} ${req.path} - ${message}`, {
        statusCode,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code: err.code || 'INTERNAL_ERROR',
        },
    });
};
