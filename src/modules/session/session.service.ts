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
        return Session.findOne({ socketId });
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
}

export const sessionService = new SessionService();
