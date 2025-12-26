import { Socket } from 'socket.io';
import { RTCSessionDescriptionInit, RTCIceCandidateInit } from './webrtc.types.js';

// Extended socket with user session data
export interface FluxSocket extends Socket {
    data: {
        sessionId?: string;
        peerId?: string;
        roomId?: string;
        joinedAt?: Date;
    };
}

// Socket event payloads
export interface JoinQueuePayload {
    // Future: could include faculty filter
}

export interface OfferPayload {
    sdp: RTCSessionDescriptionInit;
    targetId: string;
}

export interface AnswerPayload {
    sdp: RTCSessionDescriptionInit;
    targetId: string;
}

export interface IceCandidatePayload {
    candidate: RTCIceCandidateInit;
    targetId: string;
}

export interface ChatMessagePayload {
    message: string;
    targetId: string;
}

// Server -> Client events
export interface ServerToClientEvents {
    matched: (data: { peerId: string; initiator: boolean }) => void;
    waiting: () => void;
    offer: (data: { sdp: RTCSessionDescriptionInit; senderId: string }) => void;
    answer: (data: { sdp: RTCSessionDescriptionInit; senderId: string }) => void;
    'ice-candidate': (data: { candidate: RTCIceCandidateInit; senderId: string }) => void;
    'chat-message': (data: { message: string; senderId: string; timestamp: number }) => void;
    'peer-disconnected': () => void;
    'peer-typing': (data: { isTyping: boolean }) => void;
    error: (data: { message: string; code: string }) => void;
}

// Client -> Server events
export interface ClientToServerEvents {
    'join-queue': (payload?: JoinQueuePayload) => void;
    'leave-queue': () => void;
    offer: (payload: OfferPayload) => void;
    answer: (payload: AnswerPayload) => void;
    'ice-candidate': (payload: IceCandidatePayload) => void;
    'chat-message': (payload: ChatMessagePayload) => void;
    typing: (payload: { isTyping: boolean }) => void;
    next: () => void;
}

// Inter-server events (for scaling later)
export interface InterServerEvents {
    ping: () => void;
}

// Socket data
export interface SocketData {
    sessionId: string;
    peerId?: string;
    roomId?: string;
    joinedAt: Date;
}
