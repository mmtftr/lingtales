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

const GenerateStoryInputSchema = z.object({
  prompt: z.string().describe('The prompt for the story.'),
  genre: z.string().describe('The genre of the story.'),
  sourceLanguage: z
    .string()
    .describe("The user's source language for translations."),
  targetLanguage: z.string().describe('The target language for the story.'),
  level: z
    .string()
    .describe(
      'The difficulty level of the story for the language learner, based on CEFR levels (e.g., A1, B2).'
    ),
  storyHistory: z.array(StoryPartSchema).optional().describe('The previous parts of the story, used to continue the narrative.'),
  apiKey: z.string().optional().describe('The user-provided Google AI API key.'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;


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
  model: 'googleai/gemini-2.5-pro',
  system: `You are an expert language educator and a master storyteller. Your primary goal is to create compelling, coherent, and pedagogically sound stories for language learners.

**Core Directives:**
1.  **Pedagogical Rigor:** Adhere strictly to the user's specified CEFR level. The story's vocabulary, grammar, and sentence structure must be appropriate for the learner.
2.  **Narrative Quality:** Craft stories that are interesting and coherent. A story should have a clear, logical progression, including character development, plot, and setting. Use dialogue to make the story more dynamic.
3.  **Structural Integrity:** Follow the user's formatting requirements precisely. The output must be a valid JSON object matching the provided schema.

**CEFR Level Guidelines:**
- **A1 (Beginner):** Use only the most basic vocabulary (e.g., common objects, simple verbs). Sentences should be short and direct (S-V-O). Use present tense primarily.
- **A2 (Elementary):** Introduce slightly more complex vocabulary and common past tenses (e.g., Perfekt/Präteritum in German, Passé Composé in French). Sentences can be linked with simple connectors like "and", "but", "because".
- **B1 (Intermediate):** Use a wider range of vocabulary and tenses. Introduce subordinate clauses and more complex sentence structures. The story should be able to describe experiences, feelings, and ambitions.
- **B2 (Upper-Intermediate):** Employ nuanced vocabulary and complex grammatical structures comfortably. The narrative can explore abstract topics and express detailed viewpoints.
- **C1 (Advanced):** Use sophisticated, idiomatic language naturally. The story can have complex, multi-layered plots and themes.
- **C2 (Proficient):** The language should be rich, precise, and stylistically complex, equivalent to that of a native speaker in a literary context.
`,
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `
**Learner Profile:**
- Source Language (for translations): {{{sourceLanguage}}}
- Target Language: {{{targetLanguage}}}
- Learner Level (CEFR): {{{level}}}
- Desired Genre: {{{genre}}}

{{#if storyHistory}}
#--- TASK: CONTINUE AN EXISTING STORY ---#

**Goal:** Continue the story based on the history provided. Generate the next 2-3 parts of the story to create a longer, more developed narrative.

**Original User Prompt:** "{{prompt}}"

**Story So Far:**
{{#each storyHistory}}
- **Part "{{this.title}}":** {{{this.content}}}
{{/each}}

**Your Process:**
1.  First, briefly summarize the story so far for your own understanding to ensure consistency in plot, character, and tone.
2.  Then, write the next 2-3 parts of the story. Ensure the new parts flow logically from the previous ones.
3.  Do not repeat the story history in your output.
4.  The 'title' field in your response for these new story parts should be an empty string (""), as it will be ignored by the system.
5.  Create a glossary for any new, important vocabulary introduced in the new parts you have written.

{{else}}
#--- TASK: CREATE A NEW STORY ---#

**Goal:** Create a complete and engaging new story based on the user's prompt. The story should be substantial and well-structured.

**User Prompt:** "{{prompt}}"

**Your Process:**
1.  Generate a complete story with an overall title.
2.  Divide the story into a minimum of 3-4 distinct parts. Each part must have its own title, content, and translation.
3.  Create a comprehensive glossary of key terms from the entire story that are relevant to the learner's level.
{{/if}}

Remember to provide your response in the exact JSON format specified by the output schema.
`,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {
      config: {apiKey: input.apiKey},
    });
    return output!;
  }
);
