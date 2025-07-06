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
  targetLanguage: z.string().describe('The target language for the story.'),
  level: z
    .string()
    .describe(
      'The difficulty level of the story for the language learner (e.g., Beginner, Intermediate, Advanced).'
    ),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const StoryPartSchema = z.object({
  title: z.string().describe('The title of this part of the story.'),
  content: z.string().describe('The content of this part of the story in the target language.'),
  translation: z.string().describe('The translation of this part of the story in the source language.'),

});
export type StoryPart = z.infer<typeof StoryPartSchema>;

const GlossaryItemSchema = z.object({
  word: z.string().describe('The word from the story.'),
  definition: z.string().describe('The definition of the word.'),
});
export type GlossaryItem = z.infer<typeof GlossaryItemSchema>;

const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('The title of the generated story.'),
  storyParts: z.array(StoryPartSchema).describe('The story broken down into titled parts.'),
  glossary: z.array(GlossaryItemSchema).describe('A glossary of terms from the story.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `You are a creative writer who specializes in generating personalized stories for language learners.

  Based on the prompt, target language, and learner's level, you will generate a story that includes a coherent plot outline, translations, and a glossary of terms.

  Prompt: {{{prompt}}}
  Target Language: {{{targetLanguage}}}
  Learner Level: {{{level}}}

  The story should be engaging and relevant to the user's interests, and tailored to their specified learning level. 
  - A 'Beginner' level story should use simple vocabulary and sentence structures. 
  - An 'Intermediate' level story can have more complex sentences.
  - An 'Advanced' or 'Fluent' level story can be much more complex and use more nuanced vocabulary.

  Break the story into multiple parts, each with a title, content in the target language, and a translation.  Include a glossary of key terms from the story with their definitions.

  Ensure that the output is well-structured and easy to read. The translation should be in the user's source language, which is English.

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
