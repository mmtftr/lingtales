'use server';
/**
 * @fileOverview Generates personalized stories in the target language with translations, summaries, and a glossary of terms.
 *
 * - generateStory - A function that handles the story generation process.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryInputSchema = z.object({
  prompt: z.string().describe('The prompt for the story.'),
  sourceLanguage: z
    .string()
    .describe("The user's source language for translations."),
  targetLanguage: z.string().describe('The target language for the story.'),
  level: z
    .string()
    .describe(
      'The difficulty level of the story for the language learner, based on CEFR levels (e.g., A1, B2).'
    ),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const StoryPartSchema = z.object({
  title: z.string().describe('The title of this part of the story.'),
  content: z
    .string()
    .describe(
      'The content of this part of the story in the target language.'
    ),
  translation: z
    .string()
    .describe(
      'The translation of this part of the story in the source language.'
    ),
});
export type StoryPart = z.infer<typeof StoryPartSchema>;

const GlossaryItemSchema = z.object({
  word: z.string().describe('The word from the story.'),
  definition: z.string().describe('The definition of the word.'),
});
export type GlossaryItem = z.infer<typeof GlossaryItemSchema>;

const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('The title of the generated story.'),
  storyParts: z
    .array(StoryPartSchema)
    .describe('The story broken down into titled parts.'),
  glossary: z
    .array(GlossaryItemSchema)
    .describe('A glossary of terms from the story.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(
  input: GenerateStoryInput
): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `You are a creative writer who specializes in generating personalized stories for language learners.

  Based on the prompt, target language, and learner's level, you will generate a story that includes a coherent plot outline, translations, and a glossary of terms.

  Prompt: {{{prompt}}}
  Source Language (for translations): {{{sourceLanguage}}}
  Target Language: {{{targetLanguage}}}
  Learner Level (CEFR): {{{level}}}

  The story should be engaging and relevant to the user's interests, and tailored to their specified learning level.
  CEFR levels guide vocabulary and grammar complexity:
  - A1 (Beginner): Very simple phrases, basic vocabulary for immediate needs.
  - A2 (Elementary): Simple, direct information exchange on familiar topics.
  - B1 (Intermediate): Can handle most situations while traveling, describe experiences, and give reasons for opinions.
  - B2 (Upper-Intermediate): Can understand complex text, interact with fluency and spontaneity.
  - C1 (Advanced): Can use language flexibly and effectively for social, academic, and professional purposes.
  - C2 (Proficient): Can understand with ease virtually everything heard or read.

  Break the story into multiple parts, each with a title, content in the target language, and a translation in the specified source language.  Include a glossary of key terms from the story with their definitions in the source language.

  Ensure that the output is well-structured and easy to read.

  Follow this output schema:
  ${JSON.stringify(GenerateStoryOutputSchema.shape, null, 2)}
  `,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
