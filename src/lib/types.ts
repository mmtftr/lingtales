
import type { 
    GenerateStoryInput, 
    GenerateStoryOutput,
    StoryPart,
    GlossaryItem,
} from '@/ai/flows/generate-story';
import type { 
    GenerateKeywordsInput, 
    GenerateKeywordsOutput 
} from '@/ai/flows/generate-keywords';
import type { 
    GenerateGrammarExplanationInput, 
    GenerateGrammarExplanationOutput 
} from '@/ai/flows/generate-grammar-explanation';
import type { 
    AnalyzeTranslationPairInput, 
    AnalyzeTranslationPairOutput,
    ChatMessage
} from '@/ai/flows/analyze-translation-pair';
import type { 
    ExplainPhraseInput, 
    ExplainPhraseOutput 
} from '@/ai/flows/explain-phrase';

export type StoryParams = Omit<GenerateStoryInput, 'apiKey'>;

export interface ArchivedStory extends GenerateStoryOutput {
    id: string;
    params: StoryParams;
    createdAt: string;
}

export type {
    GenerateStoryInput,
    GenerateStoryOutput,
    StoryPart,
    GlossaryItem,
    GenerateKeywordsInput,
    GenerateKeywordsOutput,
    GenerateGrammarExplanationInput,
    GenerateGrammarExplanationOutput,
    AnalyzeTranslationPairInput,
    AnalyzeTranslationPairOutput,
    ChatMessage,
    ExplainPhraseInput,
    ExplainPhraseOutput
};
