import { Session, SessionDocument } from './session.model.js';
import { CreateSessionDto, UpdateSessionDto, ISession } from './session.types.js';
import { logger } from '../../shared/utils/logger.js';

class SessionService {
    async create(dto: CreateSessionDto): Promise<SessionDocument> {
        const session = new Session({
            socketId: dto.socketId,
            status: 'idle',
            joinedAt: new Date(),
            lastActiveAt: new Date(),
        });

        await session.save();
        logger.debug('Session created', { socketId: dto.socketId });
        return session;
    }

    async findBySocketId(socketId: string): Promise<SessionDocument | null> {
        return Session.findOne({ socketId }).hint({ socketId: 1 });
    }

    async update(socketId: string, dto: UpdateSessionDto): Promise<SessionDocument | null> {
        const session = await Session.findOneAndUpdate(
            { socketId },
            { ...dto, lastActiveAt: new Date() },
            { new: true }
        );

        if (session) {
            logger.debug('Session updated', { socketId, status: session.status });
        }

        return session;
    }

    async updateStatus(socketId: string, status: ISession['status']): Promise<SessionDocument | null> {
        return this.update(socketId, { status });
    }

    async setPeer(socketId: string, peerId: string, roomId: string): Promise<SessionDocument | null> {
        return this.update(socketId, { peerId, roomId, status: 'matched' });
    }

    async clearPeer(socketId: string): Promise<SessionDocument | null> {
        return this.update(socketId, { peerId: undefined, roomId: undefined, status: 'idle' });
    }

    async delete(socketId: string): Promise<boolean> {
        const result = await Session.deleteOne({ socketId });
        if (result.deletedCount > 0) {
            logger.debug('Session deleted', { socketId });
            return true;
        }
        return false;
    }

    async getActiveCount(): Promise<number> {
        return Session.countDocuments({ status: { $ne: 'idle' } });
    }

    async getWaitingCount(): Promise<number> {
        return Session.countDocuments({ status: 'waiting' });
    }

    /**
     * Cleanup stale sessions that haven't been active for specified minutes
     * (beyond the MongoDB TTL index which handles 24-hour cleanup)
     */
    async cleanupStaleSessions(staleMinutes: number = 30): Promise<number> {
        const staleThreshold = new Date(Date.now() - staleMinutes * 60 * 1000);

        const result = await Session.deleteMany({
            lastActiveAt: { $lt: staleThreshold },
            status: { $in: ['idle', 'waiting'] }, // Only cleanup non-connected sessions
        });

        if (result.deletedCount > 0) {
            logger.info('Cleaned up stale sessions', { count: result.deletedCount, staleMinutes });
        }

        return result.deletedCount;
    }

    /**
     * Start periodic session cleanup (call once at server startup)
     */
    startCleanupInterval(intervalMinutes: number = 5): NodeJS.Timeout {
        const intervalMs = intervalMinutes * 60 * 1000;

        logger.info('Starting session cleanup interval', { intervalMinutes });

        return setInterval(async () => {
            try {
                await this.cleanupStaleSessions(30);
            } catch (error) {
                logger.error('Session cleanup failed', { error });
            }
        }, intervalMs);
    }
}

export const sessionService = new SessionService();
