// WebRTC types (these are browser-native, we define them for Node.js)
// The actual WebRTC handling happens in the browser; server just relays

export interface RTCSessionDescriptionInit {
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp?: string;
}

export interface RTCIceCandidateInit {
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
    usernameFragment?: string | null;
}
