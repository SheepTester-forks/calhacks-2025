import { NextRequest, NextResponse } from 'next/server';
import { analyzeAd } from '@/services/reka';

export async function POST(request: NextRequest) {
  try {
    const { creative } = await request.json();
    if (!creative) {
      return NextResponse.json({ error: 'Ad creative is required' }, { status: 400 });
    }
    const analysis = await analyzeAd(creative);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in analyze API route:', error);
    return NextResponse.json({ error: 'Failed to analyze ad' }, { status: 500 });
  }
}