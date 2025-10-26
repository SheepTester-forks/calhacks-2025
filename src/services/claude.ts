import Anthropic from '@anthropic-ai/sdk';
import { AdAnalysis } from './reka';

const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

export const generatePersonaResponse = async (
  personaName: string,
  adAnalysis: AdAnalysis
): Promise<string> => {
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'invalid') {
    console.error('Claude API key is not configured or is invalid.');
    // Return mock data for the hackathon
    switch (personaName) {
      case 'Enthusiastic Emily':
        return 'Wow, this ad is so inspiring! I love the positive message.';
      case 'Skeptical Steve':
        return "I don't know, it feels a bit generic. I've seen this kind of ad a hundred times.";
      case 'Data-Driven Dana':
        return "The ad's focus on young professionals aligns with the product's target demographic. The data suggests this will be effective.";
      default:
        return "I'm not sure what to think about this ad.";
    }
  }

  const prompt = `You are a marketing persona in a focus group. Your name is ${personaName}.
You have just been shown an advertisement with the following analysis:
- Sentiment: ${adAnalysis.sentiment}
- Tone: ${adAnalysis.tone.join(', ')}
- Objects detected: ${adAnalysis.objects.join(', ')}
- Predicted demographic: ${adAnalysis.demographic}
- Summary: ${adAnalysis.summary}

Please provide your reaction to the ad in a single, short paragraph, staying in character as ${personaName}.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });
    const firstContentBlock = response.content[0];
    if (firstContentBlock && firstContentBlock.type === 'text') {
      return firstContentBlock.text;
    }
    return 'I am unable to provide a response with the given content.';
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return 'I am unable to provide a response at this time.';
  }
};
