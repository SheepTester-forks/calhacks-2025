export interface AdAnalysis {
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  tone: string[];
  objects: string[];
  demographic: string;
  summary: string;
}

const REKA_API_KEY = process.env.NEXT_PUBLIC_REKA_API_KEY;

export const analyzeAd = async (
  adCreative: string
): Promise<AdAnalysis | null> => {
  if (!REKA_API_KEY || REKA_API_KEY === 'invalid') {
    console.error('Reka API key is not configured or is invalid.');
    // Return mock data for the hackathon
    return {
      sentiment: 'Positive',
      tone: ['Upbeat', 'Inspirational'],
      objects: ['Laptop', 'Coffee', 'Desk'],
      demographic: 'Young Professionals (25-35)',
      summary:
        'This ad targets young professionals with an uplifting message about productivity and modern work life.',
    };
  }

  try {
    const response = await fetch('https://api.reka.ai/v1/multimodal/analyze', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REKA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media_url: adCreative,
        analysis_tasks: [
          'sentiment',
          'tone',
          'objects',
          'demographic_prediction',
          'summary',
        ],
      }),
    });

    if (!response.ok) {
      console.error('Failed to analyze ad with Reka API:', response.statusText);
      return null;
    }

    const data = await response.json();
    return {
      sentiment: data.sentiment,
      tone: data.tone,
      objects: data.objects,
      demographic: data.demographic_prediction,
      summary: data.summary,
    };
  } catch (error) {
    console.error('Error calling Reka API:', error);
    return null;
  }
};
