import { Request, Response } from 'express';
import { matchingService } from './matching.service.js';

export const matchingController = {
    async getQueueStats(req: Request, res: Response): Promise<void> {
        try {
            const queueSize = matchingService.getQueueSize();

            res.json({
                success: true,
                data: {
                    queueSize,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: 'Failed to fetch queue stats', code: 'QUEUE_STATS_ERROR' },
            });
        }
    },
};
