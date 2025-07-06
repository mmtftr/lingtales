'use server';

/**
 * @fileOverview A flow for having a conversation with Gemini about a source/target language translation pair.
 *
 * - analyzeTranslationPair - A function that takes a source phrase, its translation, and a conversation history, and returns Gemini's response.
 * - AnalyzeTranslationPairInput - The input type for the analyzeTranslationPair function.
 * - AnalyzeTranslationPairOutput - The return type for the analyzeTranslationPair function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const AnalyzeTranslationPairInputSchema = z.object({
  sourcePhrase: z.string().describe('The phrase in the source language.'),
  targetPhrase: z.string().describe('The translation of the phrase in the target language.'),
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
  apiKey: z.string().optional().describe('The user-provided Google AI API key.'),
});
export type AnalyzeTranslationPairInput = z.infer<typeof AnalyzeTranslationPairInputSchema>;

const AnalyzeTranslationPairOutputSchema = z.object({
  response: z.string().describe('Gemini\u2019s response to the user in markdown format.'),
});
export type AnalyzeTranslationPairOutput = z.infer<typeof AnalyzeTranslationPairOutputSchema>;

export async function analyzeTranslationPair(input: AnalyzeTranslationPairInput): Promise<AnalyzeTranslationPairOutput> {
  return analyzeTranslationPairFlow(input);
}

const analyzeTranslationPairPrompt = ai.definePrompt({
  name: 'analyzeTranslationPairPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: AnalyzeTranslationPairInputSchema},
  output: {schema: AnalyzeTranslationPairOutputSchema},
  prompt: `You are an expert linguist. Your task is to help a user understand the nuances of a translation.
The user is analyzing the following translation pair:
Source Phrase: {{{sourcePhrase}}}
Translation: {{{targetPhrase}}}

Respond in clear, conversational markdown. Do not wrap your entire response in a code block unless you are showing a code example.
Below is the conversation history. Continue the conversation naturally based on the last user message.

{{#each history}}
{{this.role}}: {{{this.content}}}
{{/each}}
model:`,
});

const analyzeTranslationPairFlow = ai.defineFlow(
  {
    name: 'analyzeTranslationPairFlow',
    inputSchema: AnalyzeTranslationPairInputSchema,
    outputSchema: AnalyzeTranslationPairOutputSchema,
  },
  async input => {
    const {output} = await analyzeTranslationPairPrompt(input, {
      config: {apiKey: input.apiKey},
    });
    return {response: output!.response};
  }
);
