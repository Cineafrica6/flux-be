import { Server, Socket } from 'socket.io';
import { signalingService } from './signaling.service.js';
import { SignalingOffer, SignalingAnswer, IceCandidate } from './signaling.types.js';
import { logger } from '../../shared/utils/logger.js';

export const registerSignalingEvents = (io: Server, socket: Socket): void => {
    // Handle WebRTC SDP offer
    const handleOffer = (payload: SignalingOffer) => {
        if (!signalingService.validateOffer(payload)) {
            socket.emit('error', { message: 'Invalid offer', code: 'INVALID_OFFER' });
            return;
        }

        logger.debug('Forwarding offer', { from: socket.id, to: payload.targetId });

        io.to(payload.targetId).emit('offer', {
            sdp: payload.sdp,
            senderId: socket.id,
        });
    };

    // Handle WebRTC SDP answer
    const handleAnswer = (payload: SignalingAnswer) => {
        if (!signalingService.validateAnswer(payload)) {
            socket.emit('error', { message: 'Invalid answer', code: 'INVALID_ANSWER' });
            return;
        }

        logger.debug('Forwarding answer', { from: socket.id, to: payload.targetId });

        io.to(payload.targetId).emit('answer', {
            sdp: payload.sdp,
            senderId: socket.id,
        });
    };

    // Handle ICE candidates
    const handleIceCandidate = (payload: IceCandidate) => {
        if (!signalingService.validateIceCandidate(payload)) {
            socket.emit('error', { message: 'Invalid ICE candidate', code: 'INVALID_ICE' });
            return;
        }

        logger.debug('Forwarding ICE candidate', { from: socket.id, to: payload.targetId });

        io.to(payload.targetId).emit('ice-candidate', {
            candidate: payload.candidate,
            senderId: socket.id,
        });
    };

    // Register event handlers
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
};
