// FIX: Import `useRef` from React.
import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, createLocalTracks } from 'livekit-client';
import { Buffer } from 'buffer'; // Needed for client-side JWT signing

const LIVEKIT_URL = 'wss://eduplay-g6i0baxl.livekit.cloud';
const LIVEKIT_API_KEY = 'APIH5mvXNn5DHLH';
const LIVEKIT_API_SECRET = '4argARgWJPHyxdXhMRBnJj7UQ2By3pNGBbR3Fi0qEFB';

// Helper function to encode a string to a URL-safe Base64 string.
function stringToBase64Url(str: string) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Helper function to encode an ArrayBuffer (from crypto operations) to a URL-safe Base64 string.
function arrayBufferToBase64Url(buffer: ArrayBuffer) {
    return Buffer.from(buffer)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}


// Insecure client-side token generator for development.
// Insecure client-side token generator for development.
async function getLiveKitToken(roomName: string, participantName: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        exp: now + 3600, // 1 hour expiration
        nbf: now,
        iat: now,
        iss: LIVEKIT_API_KEY,
        sub: participantName,
        jti: participantName, // A unique identifier for the token
        video: {
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
        },
    };

    // Create the unsigned token parts using the correct base64url encoding
    const headerB64 = stringToBase64Url(JSON.stringify(header));
    const payloadB64 = stringToBase64Url(JSON.stringify(payload));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Create the signature
    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(LIVEKIT_API_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(unsignedToken));
    // Encode the signature correctly
    const signatureB64 = arrayBufferToBase64Url(signature);

    // Return the full, valid JWT
    return `${unsignedToken}.${signatureB64}`;
}



export const useLiveKit = (roomName: string, participantName: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const roomRef = useRef<Room | null>(null);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
    }
    setRoom(null);
    setMediaStream(null);
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    if (roomRef.current) return;

    const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
    });
    roomRef.current = newRoom;
    setRoom(newRoom);

    newRoom.on(RoomEvent.Connected, () => setIsConnected(true));
    newRoom.on(RoomEvent.Disconnected, () => disconnect());
    
    try {
        const token = await getLiveKitToken(roomName, participantName);
        await newRoom.connect(LIVEKIT_URL, token);
        const localTracks = await createLocalTracks({ audio: true, video: true });
        
        const stream = new MediaStream();
        for (const track of localTracks) {
            await newRoom.localParticipant.publishTrack(track);
            stream.addTrack(track.mediaStreamTrack);
        }
        setMediaStream(stream);
    } catch (error) {
        console.error("Failed to connect to LiveKit room:", error);
        disconnect();
    }
  }, [roomName, participantName, disconnect]);
  
  useEffect(() => {
    // Auto-connect on mount
    connect();
    // Auto-disconnect on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return { room, isConnected, mediaStream, disconnect };
};