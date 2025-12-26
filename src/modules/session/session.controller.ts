import { Request, Response } from 'express';
import { sessionService } from './session.service.js';

export const sessionController = {
    async getStats(req: Request, res: Response): Promise<void> {
        try {
            const [activeCount, waitingCount] = await Promise.all([
                sessionService.getActiveCount(),
                sessionService.getWaitingCount(),
            ]);

            res.json({
                success: true,
                data: {
                    active: activeCount,
                    waiting: waitingCount,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: 'Failed to fetch stats', code: 'STATS_ERROR' },
            });
        }
    },
};
