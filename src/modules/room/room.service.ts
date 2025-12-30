import { randomUUID } from 'crypto';
import { Room, RoomDocument } from './room.model.js';
import { CreateRoomDto, RoomInfo } from './room.types.js';
import { logger } from '../../shared/utils/logger.js';

class RoomService {
    async createRoom(dto: CreateRoomDto): Promise<RoomDocument> {
        const room = new Room({
            roomId: randomUUID(),
            name: dto.name || `Room ${Date.now().toString(36).toUpperCase()}`,
            participants: [],
            maxParticipants: 8,
        });

        await room.save();
        logger.info('Room created', { roomId: room.roomId, name: room.name });
        return room;
    }

    async getRoom(roomId: string): Promise<RoomDocument | null> {
        return Room.findOne({ roomId });
    }

    async listRooms(): Promise<RoomInfo[]> {
        const rooms = await Room.find().sort({ createdAt: -1 }).limit(20);
        return rooms.map(room => ({
            roomId: room.roomId,
            name: room.name,
            participantCount: room.participants.length,
            maxParticipants: room.maxParticipants,
        }));
    }

    async addParticipant(roomId: string, socketId: string): Promise<RoomDocument | null> {
        const room = await Room.findOneAndUpdate(
            { roomId, $expr: { $lt: [{ $size: '$participants' }, '$maxParticipants'] } },
            { $addToSet: { participants: socketId } },
            { new: true }
        );

        if (room) {
            logger.info('Participant joined room', { roomId, socketId, count: room.participants.length });
        }
        return room;
    }

    async removeParticipant(roomId: string, socketId: string): Promise<RoomDocument | null> {
        const room = await Room.findOneAndUpdate(
            { roomId },
            { $pull: { participants: socketId } },
            { new: true }
        );

        if (room) {
            logger.info('Participant left room', { roomId, socketId, count: room.participants.length });

            // Delete room if empty
            if (room.participants.length === 0) {
                await this.deleteRoom(roomId);
            }
        }
        return room;
    }

    async removeParticipantFromAllRooms(socketId: string): Promise<void> {
        const rooms = await Room.find({ participants: socketId });
        for (const room of rooms) {
            await this.removeParticipant(room.roomId, socketId);
        }
    }

    async deleteRoom(roomId: string): Promise<boolean> {
        const result = await Room.deleteOne({ roomId });
        if (result.deletedCount > 0) {
            logger.info('Room deleted', { roomId });
            return true;
        }
        return false;
    }

    async getRoomParticipants(roomId: string): Promise<string[]> {
        const room = await this.getRoom(roomId);
        return room?.participants || [];
    }
}

export const roomService = new RoomService();
