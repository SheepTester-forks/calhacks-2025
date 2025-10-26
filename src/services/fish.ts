export const textToSpeech = async (text: string): Promise<string | null> => {
  const FISH_AUDIO_API_KEY = process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY;

  if (!FISH_AUDIO_API_KEY || FISH_AUDIO_API_KEY === 'invalid') {
    console.error('Fish Audio API key is not configured or is invalid.');
    // In a real scenario, you might return a pre-recorded audio file or nothing.
    // For the hackathon, we'll return a placeholder to indicate no audio is available.
    return 'https://example.com/audio.mp3';
  }

  try {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: 'susan', // Example voice
      }),
    });

    if (!response.ok) {
      console.error(
        'Failed to generate audio with Fish Audio API:',
        response.statusText
      );
      return null;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  } catch (error) {
    console.error('Error calling Fish Audio API:', error);
    return null;
  }
};