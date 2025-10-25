const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

export const generatePersonaResponse = async (
  personaName: string,
  adAnalysis: any
): Promise<string> => {
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'invalid') {
    console.error('Claude API key is not configured or is invalid.');
    // Return mock data for the hackathon
    switch (personaName) {
      case 'Enthusiastic Emily':
        return "Wow, this ad is so inspiring! I love the positive message.";
      case 'Skeptical Steve':
        return "I don't know, it feels a bit generic. I've seen this kind of ad a hundred times.";
      case 'Data-Driven Dana':
        return "The ad's focus on young professionals aligns with the product's target demographic. The data suggests this will be effective.";
      default:
        return "I'm not sure what to think about this ad.";
    }
  }

  // In a real application, you would make the API call to Claude here.
  // You would construct a prompt based on the persona and the ad analysis.
  return "This is a real response from Claude.";
};