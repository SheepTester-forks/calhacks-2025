import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET;
const LIVEKIT_HOST = process.env.NEXT_PUBLIC_LIVEKIT_HOST;

export const createLiveKitRoom = async (
  roomName: string,
  participantName: string
) => {
  if (
    !LIVEKIT_API_KEY ||
    LIVEKIT_API_KEY === 'invalid' ||
    !LIVEKIT_API_SECRET ||
    LIVEKIT_API_SECRET === 'invalid' ||
    !LIVEKIT_HOST
  ) {
    console.error(
      'LiveKit API key, secret, or host is not configured or is invalid.'
    );
    console.log('Simulating LiveKit room creation...');
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('LiveKit room created successfully (simulation).');
    return 'mock_room_token';
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
  });

  at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });

  return at.toJwt();
};