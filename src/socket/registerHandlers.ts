import { Server, Socket } from 'socket.io';
import { registerSessionEvents } from '../modules/session/session.events.js';
import { registerMatchingEvents } from '../modules/matching/matching.events.js';
import { registerSignalingEvents } from '../modules/signaling/signaling.events.js';
import { registerChatEvents } from '../modules/chat/chat.events.js';
import { logger } from '../shared/utils/logger.js';

export const registerSocketHandlers = (io: Server): void => {
    io.on('connection', (socket: Socket) => {
        logger.info('Socket connected', { socketId: socket.id });

        // Register all module event handlers
        registerSessionEvents(io, socket);
        registerMatchingEvents(io, socket);
        registerSignalingEvents(io, socket);
        registerChatEvents(io, socket);

        // Handle socket errors
        socket.on('error', (error) => {
            logger.error('Socket error', { socketId: socket.id, error });
        });
    });

    // Log server-level errors
    io.engine.on('connection_error', (err) => {
        logger.error('Connection error', {
            code: err.code,
            message: err.message,
            context: err.context
        });
    });
};
