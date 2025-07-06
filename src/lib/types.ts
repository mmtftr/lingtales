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
    AnalyzeTranslationPairOutput 
} from '@/ai/flows/analyze-translation-pair';

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
    AnalyzeTranslationPairOutput
};
