export interface AdAnalysis {
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  tone: string[];
  objects: string[];
  demographic: string;
  summary: string;
}

const REKA_API_KEY = process.env.NEXT_PUBLIC_REKA_API_KEY;

export const analyzeAd = async (adCreative: string): Promise<AdAnalysis | null> => {
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

  // In a real application, you would make the API call to Reka here.
  // For example:
  // const response = await fetch('https://api.reka.ai/v1/analyze', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${REKA_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ adCreative }),
  // });
  // if (!response.ok) {
  //   throw new Error('Failed to analyze ad');
  // }
  // return response.json();

  // For now, we'll just return the mock data.
  return {
    sentiment: 'Positive',
    tone: ['Upbeat', 'Inspirational'],
    objects: ['Laptop', 'Coffee', 'Desk'],
    demographic: 'Young Professionals (25-35)',
    summary:
      'This ad targets young professionals with an uplifting message about productivity and modern work life.',
  };
};