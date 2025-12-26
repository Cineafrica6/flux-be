import { ChatMessage, ChatMessageDocument } from './chat.model.js';
import { IChatMessage } from './chat.types.js';
import { logger } from '../../shared/utils/logger.js';

class ChatService {
    async saveMessage(data: Omit<IChatMessage, 'timestamp'>): Promise<ChatMessageDocument> {
        const message = new ChatMessage({
            ...data,
            timestamp: new Date(),
        });

        await message.save();
        logger.debug('Message saved', { roomId: data.roomId, senderId: data.senderId });
        return message;
    }

    async getMessagesByRoom(roomId: string, limit = 50): Promise<ChatMessageDocument[]> {
        return ChatMessage.find({ roomId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
    }

    async deleteMessagesByRoom(roomId: string): Promise<number> {
        const result = await ChatMessage.deleteMany({ roomId });
        return result.deletedCount;
    }

    validateMessage(message: string): { valid: boolean; error?: string } {
        if (!message || typeof message !== 'string') {
            return { valid: false, error: 'Message is required' };
        }

        const trimmed = message.trim();

        if (trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }

        if (trimmed.length > 1000) {
            return { valid: false, error: 'Message too long (max 1000 characters)' };
        }

        return { valid: true };
    }
}

export const chatService = new ChatService();
