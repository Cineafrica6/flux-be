import { Server, Socket } from 'socket.io';
import { sessionService } from './session.service.js';
import { logger } from '../../shared/utils/logger.js';

export const registerSessionEvents = (io: Server, socket: Socket): void => {
    // Create session on connection
    const initSession = async () => {
        try {
            await sessionService.create({ socketId: socket.id });
            logger.info('New connection', { socketId: socket.id });
        } catch (error) {
            logger.error('Failed to create session', { socketId: socket.id, error });
        }
    };

    // Cleanup on disconnect
    const handleDisconnect = async (reason: string) => {
        try {
            const session = await sessionService.findBySocketId(socket.id);

            if (session?.peerId) {
                // Notify peer about disconnection
                io.to(session.peerId).emit('peer-disconnected');

                // Clear peer's connection
                await sessionService.clearPeer(session.peerId);
            }

            await sessionService.delete(socket.id);
            logger.info('Disconnected', { socketId: socket.id, reason });
        } catch (error) {
            logger.error('Error handling disconnect', { socketId: socket.id, error });
        }
    };

    // Initialize session immediately
    initSession();

    // Register disconnect handler
    socket.on('disconnect', handleDisconnect);
};
