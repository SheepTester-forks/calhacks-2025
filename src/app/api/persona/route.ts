import { NextRequest, NextResponse } from 'next/server';
import { generatePersonaResponse } from '@/services/claude';
import { AdAnalysis } from '@/services/reka';

export async function POST(request: NextRequest) {
  try {
    const { personaName, adAnalysis } = (await request.json()) as {
      personaName: string;
      adAnalysis: AdAnalysis;
    };

    if (!personaName || !adAnalysis) {
      return NextResponse.json(
        { error: 'Persona name and ad analysis are required' },
        { status: 400 }
      );
    }

    const response = await generatePersonaResponse(personaName, adAnalysis);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in persona API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate persona response' },
      { status: 500 }
    );
  }
}