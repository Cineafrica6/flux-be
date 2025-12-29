export interface IChatMessage {
    roomId: string;
    senderId: string;
    message: string;
    timestamp: Date;
}

export interface SendMessagePayload {
    message: string;
    targetId: string;
    type?: 'text' | 'gif';
    gifUrl?: string;
}

export interface TypingPayload {
    isTyping: boolean;
}
