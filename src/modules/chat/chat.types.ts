export interface IChatMessage {
    roomId: string;
    senderId: string;
    message: string;
    timestamp: Date;
}

export interface SendMessagePayload {
    message: string;
    targetId: string;
}

export interface TypingPayload {
    isTyping: boolean;
}
