import Anthropic from '@anthropic-ai/sdk';
import { AdAnalysis } from '@/lib/types';

const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

export const analyzeAdWithClaude = async (
  adCreative: string
): Promise<AdAnalysis | null> => {
  if (adCreative.length > 1000) {
    console.error(`${adCreative}\n\nthat's too long`);
    return null;
  }
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'invalid') {
    console.error('Claude API key is not configured or is invalid.');
    // Return mock data for the hackathon
    return {
      summary:
        'This ad targets young professionals with an uplifting message about productivity and modern work life.',
      sentiment: 'Positive',
      main_themes: ['Productivity', 'Technology', 'Lifestyle'],
      target_demographic: 'Young Professionals (25-35)',
    };
  }

  const prompt = `Analyze the following advertisement creative and provide a structured analysis. The creative is: ${adCreative}.

  Respond with a JSON object with the following structure:
  {
    "summary": "A brief summary of the ad's message and style.",
    "sentiment": "Choose one: 'Positive', 'Negative', or 'Neutral'.",
    "main_themes": ["A list of the main themes or topics.", "e.g., Family, Adventure, Technology"],
    "target_demographic": "Describe the primary target audience for this ad."
  }`;

  try {
    console.log(prompt);
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    console.log(response);
    const firstContentBlock = response.content[0];
    if (firstContentBlock && firstContentBlock.type === 'text') {
      return JSON.parse(firstContentBlock.text) as AdAnalysis;
    }
    return null;
  } catch (error) {
    console.error('Error calling Claude API for analysis:', error);
    return null;
  }
};

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
- Summary: ${adAnalysis.summary}
- Sentiment: ${adAnalysis.sentiment}
- Main Themes: ${adAnalysis.main_themes.join(', ')}
- Target Demographic: ${adAnalysis.target_demographic}

Please provide your reaction to the ad in a single, short paragraph, staying in character as ${personaName}.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
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
