import { Server, Socket } from 'socket.io';
import { roomService } from './room.service.js';
import { JoinRoomPayload } from './room.types.js';
import { logger } from '../../shared/utils/logger.js';

export const registerRoomEvents = (io: Server, socket: Socket): void => {
    // Join a group room
    const handleJoinRoom = async (payload: JoinRoomPayload) => {
        try {
            const { roomId } = payload;

            // Leave any previous group rooms
            await roomService.removeParticipantFromAllRooms(socket.id);

            // Try to join the room
            const room = await roomService.addParticipant(roomId, socket.id);

            if (!room) {
                socket.emit('room-error', { message: 'Room is full or not found' });
                return;
            }

            // Join Socket.IO room for broadcasting
            socket.join(`room:${roomId}`);

            // Notify the joining user of existing participants
            const otherParticipants = room.participants.filter(id => id !== socket.id);
            socket.emit('room-users', {
                roomId,
                users: otherParticipants,
                roomName: room.name,
            });

            // Notify existing participants of the new user
            socket.to(`room:${roomId}`).emit('user-joined-room', {
                socketId: socket.id,
                roomId,
            });

            logger.info('User joined room', { socketId: socket.id, roomId, participants: room.participants.length });
        } catch (error) {
            logger.error('Error joining room', { socketId: socket.id, error });
            socket.emit('room-error', { message: 'Failed to join room' });
        }
    };

    // Leave a group room
    const handleLeaveRoom = async (payload: JoinRoomPayload) => {
        try {
            const { roomId } = payload;

            await roomService.removeParticipant(roomId, socket.id);
            socket.leave(`room:${roomId}`);

            // Notify others that user left
            socket.to(`room:${roomId}`).emit('user-left-room', {
                socketId: socket.id,
                roomId,
            });

            logger.info('User left room', { socketId: socket.id, roomId });
        } catch (error) {
            logger.error('Error leaving room', { socketId: socket.id, error });
        }
    };

    // Relay WebRTC offer to specific peer in room
    const handleRoomOffer = ({ targetId, sdp, roomId }: { targetId: string; sdp: any; roomId: string }) => {
        io.to(targetId).emit('room-offer', {
            sdp,
            senderId: socket.id,
            roomId,
        });
        logger.debug('Room offer sent', { from: socket.id, to: targetId, roomId });
    };

    // Relay WebRTC answer to specific peer in room
    const handleRoomAnswer = ({ targetId, sdp, roomId }: { targetId: string; sdp: any; roomId: string }) => {
        io.to(targetId).emit('room-answer', {
            sdp,
            senderId: socket.id,
            roomId,
        });
        logger.debug('Room answer sent', { from: socket.id, to: targetId, roomId });
    };

    // Relay ICE candidate to specific peer in room
    const handleRoomIceCandidate = ({ targetId, candidate, roomId }: { targetId: string; candidate: any; roomId: string }) => {
        io.to(targetId).emit('room-ice-candidate', {
            candidate,
            senderId: socket.id,
            roomId,
        });
    };

    // Handle disconnect - remove from all rooms
    const handleDisconnect = async () => {
        try {
            // Get rooms user was in
            const rooms = await roomService.removeParticipantFromAllRooms(socket.id);

            // Notify each room
            // Note: Socket.IO rooms are handled automatically on disconnect
        } catch (error) {
            logger.error('Error handling room disconnect', { socketId: socket.id, error });
        }
    };

    // Register event handlers
    socket.on('join-room', handleJoinRoom);
    socket.on('leave-room', handleLeaveRoom);
    socket.on('room-offer', handleRoomOffer);
    socket.on('room-answer', handleRoomAnswer);
    socket.on('room-ice-candidate', handleRoomIceCandidate);
    socket.on('disconnect', handleDisconnect);
};
