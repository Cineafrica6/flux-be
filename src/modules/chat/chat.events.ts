import { Server, Socket } from 'socket.io';
import { chatService } from './chat.service.js';
import { sessionService } from '../session/session.service.js';
import { SendMessagePayload, TypingPayload } from './chat.types.js';
import { logger } from '../../shared/utils/logger.js';

export const registerChatEvents = (io: Server, socket: Socket): void => {
    // Handle text chat messages
    const handleChatMessage = async (payload: SendMessagePayload) => {
        try {
            const validation = chatService.validateMessage(payload.message);
            if (!validation.valid) {
                socket.emit('error', { message: validation.error, code: 'INVALID_MESSAGE' });
                return;
            }

            const session = await sessionService.findBySocketId(socket.id);
            if (!session?.roomId || session.peerId !== payload.targetId) {
                socket.emit('error', { message: 'Not connected to this peer', code: 'NOT_CONNECTED' });
                return;
            }

            // Save message to database
            await chatService.saveMessage({
                roomId: session.roomId,
                senderId: socket.id,
                message: payload.message.trim(),
            });

            // Forward message to the target peer
            io.to(payload.targetId).emit('chat-message', {
                message: payload.message.trim(),
                senderId: socket.id,
                timestamp: Date.now(),
            });

            logger.debug('Chat message sent', { from: socket.id, to: payload.targetId });
        } catch (error) {
            logger.error('Error sending chat message', { socketId: socket.id, error });
            socket.emit('error', { message: 'Failed to send message', code: 'CHAT_ERROR' });
        }
    };

    // Handle typing indicator
    const handleTyping = async (payload: TypingPayload) => {
        try {
            const session = await sessionService.findBySocketId(socket.id);
            if (session?.peerId) {
                io.to(session.peerId).emit('peer-typing', { isTyping: payload.isTyping });
            }
        } catch (error) {
            logger.error('Error handling typing indicator', { socketId: socket.id, error });
        }
    };

    // Register event handlers
    socket.on('chat-message', handleChatMessage);
    socket.on('typing', handleTyping);
};
