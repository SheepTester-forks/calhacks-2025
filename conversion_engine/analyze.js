const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
if (!apiKey) {
  console.error('Error: NEXT_PUBLIC_CLAUDE_API_KEY environment variable not set.');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });

const filePath = process.argv[2];
if (!filePath) {
  console.error('Error: Please provide a file path as an argument.');
  process.exit(1);
}

async function analyzeFile() {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const prompt = `
Human: You are "The Persuasion Engine," an AI expert in conversion. Your goal is to analyze the following file and suggest improvements to make it more persuasive, effective, and compelling. Frame your feedback in a way that fits the "conversion" theme. For example, instead of "change this," you might say "to increase conversion, consider this." Analyze the content for clarity, impact, and persuasiveness.

Here is the file content:
<file_content>
${fileContent}
</file_content>

Please provide your analysis.

Assistant:`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    console.log(response.content[0].text);
  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
}

analyzeFile();