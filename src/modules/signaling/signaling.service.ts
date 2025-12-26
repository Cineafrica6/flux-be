import { logger } from '../../shared/utils/logger.js';
import { SignalingOffer, SignalingAnswer, IceCandidate } from './signaling.types.js';

class SignalingService {
    validateOffer(payload: SignalingOffer): boolean {
        if (!payload.sdp || !payload.targetId) {
            logger.warn('Invalid offer payload', { payload });
            return false;
        }
        return true;
    }

    validateAnswer(payload: SignalingAnswer): boolean {
        if (!payload.sdp || !payload.targetId) {
            logger.warn('Invalid answer payload', { payload });
            return false;
        }
        return true;
    }

    validateIceCandidate(payload: IceCandidate): boolean {
        if (!payload.candidate || !payload.targetId) {
            logger.warn('Invalid ICE candidate payload', { payload });
            return false;
        }
        return true;
    }
}

export const signalingService = new SignalingService();
