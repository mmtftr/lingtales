'use server';

/**
 * @fileOverview Keyword generation flow for story creation.
 *
 * - generateKeywords - A function that generates keywords based on genre and language.
 * - GenerateKeywordsInput - The input type for the generateKeywords function.
 * - GenerateKeywordsOutput - The return type for the generateKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateKeywordsInputSchema = z.object({
  genre: z.string().describe('The genre of the story.'),
  targetLanguage: z.string().describe('The target language for the story.'),
  apiKey: z.string().optional().describe('The user-provided Google AI API key.'),
});
export type GenerateKeywordsInput = z.infer<typeof GenerateKeywordsInputSchema>;

const GenerateKeywordsOutputSchema = z.object({
  keywords: z.array(z.string()).describe('An array of relevant keywords for the story.'),
});
export type GenerateKeywordsOutput = z.infer<typeof GenerateKeywordsOutputSchema>;

export async function generateKeywords(input: GenerateKeywordsInput): Promise<GenerateKeywordsOutput> {
  return generateKeywordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateKeywordsPrompt',
  model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
  input: {schema: GenerateKeywordsInputSchema},
  output: {schema: GenerateKeywordsOutputSchema},
  prompt: `You are a creative writing assistant. Your task is to suggest keywords for a story based on its genre and target language.

  Genre: {{{genre}}}
  Target Language: {{{targetLanguage}}}

  Provide a list of keywords that are relevant to the genre and suitable for a story in the target language.
  The keywords should help the user brainstorm ideas and focus on crafting the narrative.
  Return the keywords as a JSON array.
  `,
});

const generateKeywordsFlow = ai.defineFlow(
  {
    name: 'generateKeywordsFlow',
    inputSchema: GenerateKeywordsInputSchema,
    outputSchema: GenerateKeywordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {
      config: {apiKey: input.apiKey},
    });
    return output!;
  }
);
