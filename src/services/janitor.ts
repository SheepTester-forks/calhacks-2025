import { generatePersonaResponse } from './claude';
import { AdAnalysis } from './reka';

const JANITOR_API_KEY = process.env.NEXT_PUBLIC_JANITOR_API_KEY;

export interface Persona {
  name: string;
  avatar: string;
}

export interface ChatTurn {
  persona: Persona;
  text: string;
}

const personas: Persona[] = [
  { name: 'Enthusiastic Emily', avatar: '/avatars/emily.png' },
  { name: 'Skeptical Steve', avatar: '/avatars/steve.png' },
  { name: 'Data-Driven Dana', avatar: '/avatars/dana.png' },
];

export const startChatSimulation = async (
  adAnalysis: AdAnalysis,
  onMessage: (turn: ChatTurn) => void
) => {
  if (!JANITOR_API_KEY || JANITOR_API_KEY === 'invalid') {
    console.error('Janitor AI API key is not configured or is invalid.');
    // Simulate the chat for the hackathon
    for (const persona of personas) {
      const text = await generatePersonaResponse(persona.name, adAnalysis);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay
      onMessage({ persona, text });
    }
    return;
  }

  // In a real application, you would connect to the Janitor AI service here.
};