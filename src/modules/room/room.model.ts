import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom {
    roomId: string;
    name: string;
    participants: string[];
    createdAt: Date;
    maxParticipants: number;
}

export interface RoomDocument extends IRoom, Document { }

const roomSchema = new Schema<RoomDocument>(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            maxlength: 50,
        },
        participants: {
            type: [String],
            default: [],
        },
        maxParticipants: {
            type: Number,
            default: 8,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-delete empty rooms after 1 hour
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export const Room = mongoose.model<RoomDocument>('Room', roomSchema);
