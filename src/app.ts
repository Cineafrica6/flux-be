import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/environment.js';
import { errorMiddleware } from './shared/middleware/error.middleware.js';
import { sessionController } from './modules/session/session.controller.js';
import { matchingController } from './modules/matching/matching.controller.js';
import { turnController } from './modules/turn/turn.controller.js';

// Parse CORS origins - supports comma-separated list
const getAllowedOrigins = (): string[] => {
    const origins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    // Always allow these for development
    if (!origins.includes('http://localhost:3000')) {
        origins.push('http://localhost:3000');
    }
    return origins;
};

export const createApp = (): Application => {
    const app = express();

    // Middleware - support multiple CORS origins
    const allowedOrigins = getAllowedOrigins();
    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            // For debugging, log rejected origins
            console.log(`CORS: Rejected origin ${origin}`);
            return callback(null, false);
        },
        credentials: true,
    }));
    app.use(express.json());

    // Health check
    app.get('/health', (req: Request, res: Response) => {
        res.json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            },
        });
    });

    // API routes
    app.get('/api/stats/sessions', sessionController.getStats);
    app.get('/api/stats/queue', matchingController.getQueueStats);
    app.get('/api/turn/credentials', turnController.getCredentials);

    // 404 handler
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: { message: 'Not Found', code: 'NOT_FOUND' },
        });
    });

    // Error handler
    app.use(errorMiddleware);

    return app;
};
