"use server";

/**
 * @fileOverview Grammar explanation flow.
 *
 * - generateGrammarExplanation - A function that generates grammar explanations for a given word or phrase.
 * - GenerateGrammarExplanationInput - The input type for the generateGrammarExplanation function.
 * - GenerateGrammarExplanationOutput - The return type for the generateGrammarExplanation function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateGrammarExplanationInputSchema = z.object({
  wordOrPhrase: z
    .string()
    .describe("The word or phrase to generate a grammar explanation for."),
  language: z.string().describe("The language of the word or phrase."),
  apiKey: z
    .string()
    .optional()
    .describe("The user-provided Google AI API key."),
});
export type GenerateGrammarExplanationInput = z.infer<
  typeof GenerateGrammarExplanationInputSchema
>;

const GenerateGrammarExplanationOutputSchema = z.object({
  explanation: z
    .string()
    .describe("The grammar explanation in markdown format."),
});
export type GenerateGrammarExplanationOutput = z.infer<
  typeof GenerateGrammarExplanationOutputSchema
>;

export async function generateGrammarExplanation(
  input: GenerateGrammarExplanationInput,
): Promise<GenerateGrammarExplanationOutput> {
  return generateGrammarExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateGrammarExplanationPrompt",
  input: { schema: GenerateGrammarExplanationInputSchema },
  output: { schema: GenerateGrammarExplanationOutputSchema },
  prompt: `You are an expert grammar teacher.

  Provide a grammar explanation for the following word or phrase in the given language.  The explanation should be in markdown format.

  Word or Phrase: {{{wordOrPhrase}}}
  Language: {{{language}}}`,
});

const generateGrammarExplanationFlow = ai.defineFlow(
  {
    name: "generateGrammarExplanationFlow",
    inputSchema: GenerateGrammarExplanationInputSchema,
    outputSchema: GenerateGrammarExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, {
      config: { apiKey: input.apiKey },
    });
    return output!;
  },
);
