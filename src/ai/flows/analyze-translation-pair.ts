// 'use server';

/**
 * @fileOverview A flow for analyzing a source language phrase and its target language translation using Gemini.
 *
 * - analyzeTranslationPair - A function that takes a source phrase and its translation, and returns Gemini's analysis.
 * - AnalyzeTranslationPairInput - The input type for the analyzeTranslationPair function.
 * - AnalyzeTranslationPairOutput - The return type for the analyzeTranslationPair function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTranslationPairInputSchema = z.object({
  sourcePhrase: z.string().describe('The phrase in the source language.'),
  targetPhrase: z.string().describe('The translation of the phrase in the target language.'),
});
export type AnalyzeTranslationPairInput = z.infer<typeof AnalyzeTranslationPairInputSchema>;

const AnalyzeTranslationPairOutputSchema = z.object({
  analysis: z.string().describe('Gemini\u2019s analysis of the source and target language phrase pair in markdown format.'),
});
export type AnalyzeTranslationPairOutput = z.infer<typeof AnalyzeTranslationPairOutputSchema>;

export async function analyzeTranslationPair(input: AnalyzeTranslationPairInput): Promise<AnalyzeTranslationPairOutput> {
  return analyzeTranslationPairFlow(input);
}

const analyzeTranslationPairPrompt = ai.definePrompt({
  name: 'analyzeTranslationPairPrompt',
  input: {schema: AnalyzeTranslationPairInputSchema},
  output: {schema: AnalyzeTranslationPairOutputSchema},
  prompt: `You are an expert linguist. Analyze the following source language phrase and its translation. Explain any nuances, differences in meaning, or cultural context that might be relevant. Provide your response in markdown format.\n\nSource Phrase: {{{sourcePhrase}}}\nTranslation: {{{targetPhrase}}}`,
});

const analyzeTranslationPairFlow = ai.defineFlow(
  {
    name: 'analyzeTranslationPairFlow',
    inputSchema: AnalyzeTranslationPairInputSchema,
    outputSchema: AnalyzeTranslationPairOutputSchema,
  },
  async input => {
    const {output} = await analyzeTranslationPairPrompt(input);
    return output!;
  }
);
