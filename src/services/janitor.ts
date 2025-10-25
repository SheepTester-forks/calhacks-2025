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

/**
 * In a real application, this function would connect to a Janitor AI-powered
 * backend service (likely via WebSocket) to manage the multi-agent chat.
 * The backend would be responsible for orchestrating the AI personas,
 * managing the conversation flow, and broadcasting messages to the client.
 *
 * For this hackathon, we simulate this process by iterating through the
 * personas and generating their responses sequentially using the Claude service.
 */
export const startChatSimulation = async (
  adAnalysis: AdAnalysis,
  onMessage: (turn: ChatTurn) => void
) => {
  if (!JANITOR_API_KEY || JANITOR_API_KEY === 'invalid') {
    console.error('Janitor AI API key is not configured or is invalid.');
    // Simulate the chat for the hackathon
    for (const persona of personas) {
      try {
        const response = await fetch('/api/persona', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ personaName: persona.name, adAnalysis }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate persona response');
        }

        const { response: text } = await response.json();
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay
        onMessage({ persona, text });
      } catch (error) {
        console.error(`Failed to get response for ${persona.name}:`, error);
        // Continue with the next persona
      }
    }
    return;
  }

  // To implement this for real, you would:
  // 1. Establish a WebSocket connection to your Janitor AI backend.
  // 2. Send the ad analysis to the backend to initialize the simulation.
  // 3. Listen for incoming messages from the WebSocket.
  // 4. When a message is received, call the `onMessage` callback to update the UI.
  //
  // Example:
  // const socket = new WebSocket(`wss://your-janitor-ai-backend.com?apiKey=${JANITOR_API_KEY}`);
  //
  // socket.onopen = () => {
  //   socket.send(JSON.stringify({ type: 'start_simulation', payload: adAnalysis }));
  // };
  //
  // socket.onmessage = (event) => {
  //   const message = JSON.parse(event.data);
  //   if (message.type === 'chat_turn') {
  //     onMessage(message.payload);
  //   }
  // };
  //
  // socket.onerror = (error) => {
  //   console.error('WebSocket error:', error);
  // };
};
