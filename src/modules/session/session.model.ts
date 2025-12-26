import mongoose, { Schema, Document } from 'mongoose';
import { ISession } from './session.types.js';

export interface SessionDocument extends ISession, Document { }

const sessionSchema = new Schema<SessionDocument>(
    {
        socketId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        peerId: {
            type: String,
            default: null,
        },
        roomId: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['idle', 'waiting', 'matched', 'connected'],
            default: 'idle',
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        lastActiveAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-delete sessions after 24 hours of inactivity
sessionSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 86400 });

export const Session = mongoose.model<SessionDocument>('Session', sessionSchema);
