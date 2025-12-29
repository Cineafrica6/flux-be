import { Request, Response } from 'express';
import { logger } from '../../shared/utils/logger.js';

// Cloudflare TURN credentials from environment
const TURN_KEY_ID = process.env.CLOUDFLARE_TURN_KEY_ID;
const TURN_API_TOKEN = process.env.CLOUDFLARE_TURN_API_TOKEN;

export const turnController = {
    async getCredentials(req: Request, res: Response) {
        if (!TURN_KEY_ID || !TURN_API_TOKEN) {
            logger.warn('TURN credentials not configured in environment');
            // Return fallback STUN-only config
            return res.json({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            });
        }

        try {
            const response = await fetch(
                `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_KEY_ID}/credentials/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TURN_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ttl: 86400 }), // 24 hours
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                logger.error('Cloudflare TURN API error', { status: response.status, error: errorText });
                throw new Error(`Cloudflare API returned ${response.status}`);
            }

            const data = await response.json();
            logger.debug('Generated TURN credentials successfully');

            res.json(data);
        } catch (error) {
            logger.error('Failed to get TURN credentials', { error });
            // Return fallback STUN-only config
            res.json({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            });
        }
    },
};
