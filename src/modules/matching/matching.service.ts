import { randomUUID } from 'crypto';
import { QueuedUser, MatchResult } from './matching.types.js';
import { sessionService } from '../session/session.service.js';
import { logger } from '../../shared/utils/logger.js';

class MatchingService {
    private queue: Map<string, QueuedUser> = new Map();

    addToQueue(socketId: string): boolean {
        if (this.queue.has(socketId)) {
            logger.debug('User already in queue', { socketId });
            return false;
        }

        this.queue.set(socketId, {
            socketId,
            joinedAt: new Date(),
        });

        logger.info('User joined queue', { socketId, queueSize: this.queue.size });
        return true;
    }

    removeFromQueue(socketId: string): boolean {
        const removed = this.queue.delete(socketId);
        if (removed) {
            logger.info('User left queue', { socketId, queueSize: this.queue.size });
        }
        return removed;
    }

    isInQueue(socketId: string): boolean {
        return this.queue.has(socketId);
    }

    getQueueSize(): number {
        return this.queue.size;
    }

    async tryMatch(socketId: string): Promise<MatchResult | null> {
        // Find another user in the queue (not the same user)
        for (const [otherId, user] of this.queue) {
            if (otherId !== socketId) {
                // Found a match!
                const roomId = randomUUID();

                // Remove both from queue
                this.queue.delete(socketId);
                this.queue.delete(otherId);

                // Update sessions
                await Promise.all([
                    sessionService.setPeer(socketId, otherId, roomId),
                    sessionService.setPeer(otherId, socketId, roomId),
                ]);

                const match: MatchResult = {
                    user1: socketId,
                    user2: otherId,
                    roomId,
                };

                logger.info('Users matched', { user1: socketId, user2: otherId, roomId });
                return match;
            }
        }

        return null;
    }

    async findNewMatch(socketId: string): Promise<MatchResult | null> {
        // Get current session to find current peer
        const session = await sessionService.findBySocketId(socketId);
        const currentPeerId = session?.peerId;

        // Clear current peer connection
        if (currentPeerId) {
            await sessionService.clearPeer(currentPeerId);
            await sessionService.clearPeer(socketId);
        }

        // Add to queue and try to find new match
        this.addToQueue(socketId);
        return this.tryMatch(socketId);
    }

    /**
     * Remove users from queue who have been waiting too long (stale)
     * This prevents memory leaks from abandoned sessions
     */
    cleanupStaleQueueUsers(staleMinutes: number = 10): number {
        const staleThreshold = Date.now() - staleMinutes * 60 * 1000;
        let removedCount = 0;

        for (const [socketId, user] of this.queue) {
            if (user.joinedAt.getTime() < staleThreshold) {
                this.queue.delete(socketId);
                removedCount++;
                logger.debug('Removed stale user from queue', { socketId });
            }
        }

        if (removedCount > 0) {
            logger.info('Queue cleanup completed', { removedCount, queueSize: this.queue.size });
        }

        return removedCount;
    }

    /**
     * Start periodic queue cleanup
     */
    startQueueCleanupInterval(intervalMinutes: number = 5): NodeJS.Timeout {
        const intervalMs = intervalMinutes * 60 * 1000;

        logger.info('Starting queue cleanup interval', { intervalMinutes });

        return setInterval(() => {
            this.cleanupStaleQueueUsers(10);
        }, intervalMs);
    }
}

export const matchingService = new MatchingService();
