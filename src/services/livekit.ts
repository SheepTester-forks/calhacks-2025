const LIVEKIT_API_KEY = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET;

export const createLiveKitRoom = async () => {
  if (
    !LIVEKIT_API_KEY ||
    LIVEKIT_API_KEY === 'invalid' ||
    !LIVEKIT_API_SECRET ||
    LIVEKIT_API_SECRET === 'invalid'
  ) {
    console.error('LiveKit API key or secret is not configured or is invalid.');
    console.log('Simulating LiveKit room creation...');
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('LiveKit room created successfully (simulation).');
    return 'mock_room_token';
  }

  // In a real application, you would create a LiveKit room and generate a
  // token for the user here.
};