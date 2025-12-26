import mongoose, { Schema, Document } from 'mongoose';
import { IChatMessage } from './chat.types.js';

export interface ChatMessageDocument extends IChatMessage, Document { }

const chatMessageSchema = new Schema<ChatMessageDocument>(
    {
        roomId: {
            type: String,
            required: true,
            index: true,
        },
        senderId: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-delete messages after 7 days
chatMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

export const ChatMessage = mongoose.model<ChatMessageDocument>('ChatMessage', chatMessageSchema);
