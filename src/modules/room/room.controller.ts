import { Request, Response } from 'express';
import { roomService } from './room.service.js';
import { logger } from '../../shared/utils/logger.js';

class RoomController {
    async listRooms(req: Request, res: Response): Promise<void> {
        try {
            const rooms = await roomService.listRooms();
            res.json({ success: true, data: rooms });
        } catch (error) {
            logger.error('Failed to list rooms', { error });
            res.status(500).json({ success: false, error: { message: 'Failed to list rooms' } });
        }
    }

    async createRoom(req: Request, res: Response): Promise<void> {
        try {
            const { name } = req.body;
            const room = await roomService.createRoom({ name: name || '' });
            res.json({
                success: true,
                data: {
                    roomId: room.roomId,
                    name: room.name,
                    participantCount: 0,
                    maxParticipants: room.maxParticipants,
                },
            });
        } catch (error) {
            logger.error('Failed to create room', { error });
            res.status(500).json({ success: false, error: { message: 'Failed to create room' } });
        }
    }

    async getRoom(req: Request, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;
            const room = await roomService.getRoom(roomId);

            if (!room) {
                res.status(404).json({ success: false, error: { message: 'Room not found' } });
                return;
            }

            res.json({
                success: true,
                data: {
                    roomId: room.roomId,
                    name: room.name,
                    participantCount: room.participants.length,
                    maxParticipants: room.maxParticipants,
                },
            });
        } catch (error) {
            logger.error('Failed to get room', { error });
            res.status(500).json({ success: false, error: { message: 'Failed to get room' } });
        }
    }
}

export const roomController = new RoomController();
