export interface QueuedUser {
    socketId: string;
    joinedAt: Date;
}

export interface MatchResult {
    user1: string;
    user2: string;
    roomId: string;
}
