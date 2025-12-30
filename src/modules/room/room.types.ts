export interface CreateRoomDto {
    name: string;
}

export interface JoinRoomPayload {
    roomId: string;
}

export interface RoomInfo {
    roomId: string;
    name: string;
    participantCount: number;
    maxParticipants: number;
}
