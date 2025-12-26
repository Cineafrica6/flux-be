import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/environment.js';
import { errorMiddleware } from './shared/middleware/error.middleware.js';
import { sessionController } from './modules/session/session.controller.js';
import { matchingController } from './modules/matching/matching.controller.js';

export const createApp = (): Application => {
    const app = express();

    // Middleware
    app.use(cors({
        origin: env.CORS_ORIGIN,
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
