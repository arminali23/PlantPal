import Anthropic from '@anthropic-ai/sdk';
import { PLANT_SYSTEM_PROMPT } from '../constants/prompts';
import { Plant, PlantIdentificationResult, IdentificationError } from '../types/plant';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function identifyPlant(base64Image: string): Promise<PlantIdentificationResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: PLANT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'Identify this plant and return the JSON object as specified.',
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as PlantIdentificationResult | IdentificationError;

  if ('error' in parsed) {
    throw new Error(parsed.error);
  }

  return parsed;
}
