"use server";

/**
 * @fileOverview Explains a selected phrase from a story.
 *
 * - explainPhrase - A function that generates an explanation for a selected phrase within its context.
 * - ExplainPhraseInput - The input type for the explainPhrase function.
 * - ExplainPhraseOutput - The return type for the explainPhrase function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ExplainPhraseInputSchema = z.object({
  phrase: z.string().describe("The selected phrase to explain."),
  context: z
    .string()
    .describe("The full text content where the phrase was found."),
  sourceLanguage: z
    .string()
    .describe("The language in which to provide the explanation."),
  targetLanguage: z
    .string()
    .describe("The language of the phrase and context."),
  apiKey: z
    .string()
    .optional()
    .describe("The user-provided Google AI API key."),
});
export type ExplainPhraseInput = z.infer<typeof ExplainPhraseInputSchema>;

const ExplainPhraseOutputSchema = z.object({
  explanation: z
    .string()
    .describe("A concise explanation of the phrase in the source language."),
});
export type ExplainPhraseOutput = z.infer<typeof ExplainPhraseOutputSchema>;

export async function explainPhrase(
  input: ExplainPhraseInput,
): Promise<ExplainPhraseOutput> {
  return explainPhraseFlow(input);
}

const prompt = ai.definePrompt({
  name: "explainPhrasePrompt",
  model: "googleai/gemini-2.5-flash-lite-preview-06-17",
  input: { schema: ExplainPhraseInputSchema },
  output: { schema: ExplainPhraseOutputSchema },
  prompt: `You are a language tutor. The user has selected a phrase from a text they are reading in {{targetLanguage}}.
      Explain the meaning of the selected phrase within its context. Provide the explanation in {{sourceLanguage}}. Keep it concise, like a tooltip.

      Context: "{{{context}}}"
      Selected Phrase: "{{{phrase}}}"
      `,
});

const explainPhraseFlow = ai.defineFlow(
  {
    name: "explainPhraseFlow",
    inputSchema: ExplainPhraseInputSchema,
    outputSchema: ExplainPhraseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, {
      config: { apiKey: input.apiKey },
    });
    return output!;
  },
);
