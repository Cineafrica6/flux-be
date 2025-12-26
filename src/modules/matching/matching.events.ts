import { Server, Socket } from 'socket.io';
import { matchingService } from './matching.service.js';
import { sessionService } from '../session/session.service.js';
import { logger } from '../../shared/utils/logger.js';

export const registerMatchingEvents = (io: Server, socket: Socket): void => {
    // User wants to join the matching queue
    const handleJoinQueue = async () => {
        try {
            // Add to queue
            const added = matchingService.addToQueue(socket.id);
            if (!added) {
                return; // Already in queue
            }

            // Update session status
            await sessionService.updateStatus(socket.id, 'waiting');

            // Try to find a match immediately
            const match = await matchingService.tryMatch(socket.id);

            if (match) {
                // Notify both users about the match
                // User1 is the initiator (will create the offer)
                io.to(match.user1).emit('matched', { peerId: match.user2, initiator: true });
                io.to(match.user2).emit('matched', { peerId: match.user1, initiator: false });

                logger.info('Match notification sent', { match });
            } else {
                // No match found, notify user they're waiting
                socket.emit('waiting');
                logger.debug('User waiting for match', { socketId: socket.id });
            }
        } catch (error) {
            logger.error('Error in join-queue', { socketId: socket.id, error });
            socket.emit('error', { message: 'Failed to join queue', code: 'QUEUE_ERROR' });
        }
    };

    // User wants to leave the queue
    const handleLeaveQueue = async () => {
        try {
            matchingService.removeFromQueue(socket.id);
            await sessionService.updateStatus(socket.id, 'idle');
            logger.debug('User left queue', { socketId: socket.id });
        } catch (error) {
            logger.error('Error in leave-queue', { socketId: socket.id, error });
        }
    };

    // User wants to find a new random peer (skip current)
    const handleNext = async () => {
        try {
            const session = await sessionService.findBySocketId(socket.id);
            const currentPeerId = session?.peerId;

            // Notify current peer about disconnection
            if (currentPeerId) {
                io.to(currentPeerId).emit('peer-disconnected');
                await sessionService.clearPeer(currentPeerId);

                // Put the other user back in queue automatically
                matchingService.addToQueue(currentPeerId);
                await sessionService.updateStatus(currentPeerId, 'waiting');

                // Try to find a match for them too
                const theirMatch = await matchingService.tryMatch(currentPeerId);
                if (theirMatch) {
                    io.to(theirMatch.user1).emit('matched', { peerId: theirMatch.user2, initiator: true });
                    io.to(theirMatch.user2).emit('matched', { peerId: theirMatch.user1, initiator: false });
                } else {
                    io.to(currentPeerId).emit('waiting');
                }
            }

            // Find new match for the current user
            const match = await matchingService.findNewMatch(socket.id);

            if (match) {
                io.to(match.user1).emit('matched', { peerId: match.user2, initiator: true });
                io.to(match.user2).emit('matched', { peerId: match.user1, initiator: false });
            } else {
                socket.emit('waiting');
            }
        } catch (error) {
            logger.error('Error in next', { socketId: socket.id, error });
            socket.emit('error', { message: 'Failed to find new match', code: 'NEXT_ERROR' });
        }
    };

    // Cleanup on disconnect
    const handleDisconnect = () => {
        matchingService.removeFromQueue(socket.id);
    };

    // Register event handlers
    socket.on('join-queue', handleJoinQueue);
    socket.on('leave-queue', handleLeaveQueue);
    socket.on('next', handleNext);
    socket.on('disconnect', handleDisconnect);
};
