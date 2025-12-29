import { createServer } from 'http';
import { createApp } from './app.js';
import { env, connectDatabase } from './config/index.js';
import { initializeSocket } from './socket/index.js';
import { logger } from './shared/utils/logger.js';
import { sessionService } from './modules/session/session.service.js';
import { matchingService } from './modules/matching/matching.service.js';

const startServer = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Create Express app
        const app = createApp();

        // Create HTTP server
        const httpServer = createServer(app);

        // Initialize Socket.IO
        const io = initializeSocket(httpServer);

        // Start cleanup intervals (every 5 minutes)
        sessionService.startCleanupInterval(5);
        matchingService.startQueueCleanupInterval(5);

        // Start listening
        httpServer.listen(env.PORT, () => {
            logger.info(`🚀 Server running on port ${env.PORT}`);
            logger.info(`📡 Socket.IO path: ${env.SOCKET_PATH}`);
            logger.info(`🌍 CORS origin: ${env.CORS_ORIGIN}`);
            logger.info(`🔧 Environment: ${env.NODE_ENV}`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Shutting down gracefully...`);

            httpServer.close(() => {
                logger.info('HTTP server closed');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
};

startServer();
