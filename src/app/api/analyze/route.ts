import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeAdWithClaude,
  generatePersonaResponse,
} from '@/services/claude';
import { textToSpeech } from '@/services/fish';
import { AdAnalysis, ChatTurn, Persona } from '@/lib/types';

const personas: Persona[] = [
  { name: 'Enthusiastic Emily', avatar: '/avatars/emily.png' },
  { name: 'Skeptical Steve', avatar: '/avatars/steve.png' },
  { name: 'Data-Driven Dana', avatar: '/avatars/dana.png' },
];

export async function POST(request: NextRequest) {
  try {
    const { creative } = await request.json();
    if (!creative) {
      return NextResponse.json(
        { error: 'Ad creative is required' },
        { status: 400 }
      );
    }

    console.log('wow');
    const analysis: AdAnalysis | null = await analyzeAdWithClaude(creative);
    console.log(analysis);
    if (!analysis) {
      return NextResponse.json(
        { error: 'Failed to analyze ad' },
        { status: 500 }
      );
    }

    console.log('hello');
    const chatPromises = personas.map(async (persona) => {
      const text = await generatePersonaResponse(persona.name, analysis);
      console.log(text);
      const audioUrl = await textToSpeech(text);
      console.log(audioUrl);
      return { persona, text, audioUrl };
    });

    const chat: ChatTurn[] = await Promise.all(chatPromises);

    return NextResponse.json({ analysis, chat });
  } catch (error) {
    console.error('Error in analyze API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
