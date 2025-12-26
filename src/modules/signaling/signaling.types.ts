import { RTCSessionDescriptionInit, RTCIceCandidateInit } from '../../shared/types/webrtc.types.js';

export interface SignalingOffer {
    sdp: RTCSessionDescriptionInit;
    targetId: string;
}

export interface SignalingAnswer {
    sdp: RTCSessionDescriptionInit;
    targetId: string;
}

export interface IceCandidate {
    candidate: RTCIceCandidateInit;
    targetId: string;
}
