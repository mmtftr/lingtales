import { config } from "dotenv";
config();

import "@/ai/flows/generate-story.ts";
import "@/ai/flows/generate-keywords.ts";
import "@/ai/flows/generate-grammar-explanation.ts";
import "@/ai/flows/analyze-translation-pair.ts";
import "@/ai/flows/explain-phrase.ts";
