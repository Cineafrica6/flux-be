export interface ISession {
    socketId: string;
    peerId?: string;
    roomId?: string;
    status: 'idle' | 'waiting' | 'matched' | 'connected';
    joinedAt: Date;
    lastActiveAt: Date;
}

export interface CreateSessionDto {
    socketId: string;
}

export interface UpdateSessionDto {
    peerId?: string;
    roomId?: string;
    status?: ISession['status'];
    lastActiveAt?: Date;
}
