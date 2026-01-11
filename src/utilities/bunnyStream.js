import axios from 'axios';
import crypto from 'crypto';
import { CustomError } from './customError.js';

// Configuration (Should be in process.env)
// const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
// const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
// const BUNNY_TOKEN_KEY = process.env.BUNNY_TOKEN_KEY;

/**
 * Generate a Signed URL for Bunny Stream video
 * @param {string} videoId - The Bunny.net Video ID
 * @param {number} expiresInSeconds - Time in seconds until the link expires (default 1 hour)
 * @returns {string} - The signed authorization query parameters or full URL
 */
export const createCollection = async (collectionName) => {
    const { BUNNY_LIBRARY_ID, BUNNY_API_KEY } = process.env;

    if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
        throw new CustomError("Bunny config missing", 500);
    }

    try {
        const response = await axios.post(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/collections`,
            { name: collectionName },
            {
                headers: {
                    AccessKey: BUNNY_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data; // هيرجع الـ GUID الخاص بالـ Collection
    } catch (error) {
        throw new CustomError(`Bunny Collection Error: ${error.response?.data?.message || error.message}`, 500);
    }
};

export const generateSignedUrl = (videoId, expiresInSeconds = 3600) => {
    const BUNNY_TOKEN_KEY = process.env.BUNNY_TOKEN_KEY;
    if (!BUNNY_TOKEN_KEY) {
        throw new Error("BUNNY_TOKEN_KEY is missing in environment variables");
    }

    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const tokenSecurityKey = BUNNY_TOKEN_KEY;
    
    // Bunny.net Token Authentication format
    // sha256(securityKey + videoId + expires)
    const hash = crypto.createHash('sha256');
    hash.update(tokenSecurityKey + videoId + expires);
    const token = hash.digest('hex');

    return {
        token,
        expires,
        videoId
    };
};

/**
 * Upload a video to Bunny Stream (Server-side init, returns videoId)
 * Usually, we create the video object first, then upload the file using that ID.
 */
export const createVideoEntry = async (title, collectionId) => {
    const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID
    const BUNNY_API_KEY = process.env.BUNNY_API_KEY
    
    try {
        const response = await axios.post(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
            { 
                title, 
                collectionId // هنا الفيديو هينزل جوه الفولدر أوتوماتيك
            },
            {
                headers: {
                    AccessKey: BUNNY_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new CustomError(`Bunny Video Error: ${error.response?.data?.message || error.message}`, 500);
    }
};
export const deleteVideoEntry = async (bunnyVideoId) => {
    const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
    const BUNNY_API_KEY = process.env.BUNNY_API_KEY;

    if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
        throw new CustomError("BUNNY_LIBRARY_ID or BUNNY_API_KEY missing", 500);
    }

    try {
        await axios.delete(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${bunnyVideoId}`,
            {
                headers: {
                    AccessKey: BUNNY_API_KEY
                }
            }
        );
        return true;
    } catch (error) {
        throw new CustomError(`BunnyDelete Error: ${error.message}`, 500);
    }
};
