"use client";

import { useState } from "react";
import { Copy, HelpCircle, Languages, Loader2, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { GenerateStoryOutput, StoryPart } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { generateGrammarExplanation } from "@/ai/flows/generate-grammar-explanation";
import { analyzeTranslationPair } from "@/ai/flows/analyze-translation-pair";

interface StoryDisplayProps {
  story: GenerateStoryOutput;
  targetLanguage: string;
}

export function StoryDisplay({ story, targetLanguage }: StoryDisplayProps) {
  const { toast } = useToast();
  const [isGrammarDialogOpen, setIsGrammarDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: "", isLoading: false });

  const handleCopy = () => {
    const storyText = story.storyParts.map((part) => `${part.title}\n\n${part.content}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(storyText);
    toast({
      title: "Success!",
      description: "The story has been copied to your clipboard.",
    });
  };
  
  const handleGrammarExplanation = async (word: string) => {
    setIsGrammarDialogOpen(true);
    setModalContent({ title: `Grammar: "${word}"`, content: "", isLoading: true });
    try {
      const result = await generateGrammarExplanation({ wordOrPhrase: word, language: targetLanguage });
      setModalContent((prev) => ({ ...prev, content: result.explanation, isLoading: false }));
    } catch (error) {
      console.error(error);
      setModalContent((prev) => ({ ...prev, content: "Failed to load explanation.", isLoading: false }));
    }
  };

  const handleTranslationAnalysis = async (part: StoryPart) => {
    setIsAnalysisDialogOpen(true);
    setModalContent({ title: `Analysis: "${part.title}"`, content: "", isLoading: true });
    try {
      const result = await analyzeTranslationPair({ sourcePhrase: part.content, targetPhrase: part.translation });
      setModalContent((prev) => ({ ...prev, content: result.analysis, isLoading: false }));
    } catch (error) {
      console.error(error);
      setModalContent((prev) => ({ ...prev, content: "Failed to load analysis.", isLoading: false }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-3xl">{story.title}</CardTitle>
              <CardDescription>Your personalized story in {targetLanguage}.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Story
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {story.storyParts.map((part, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="font-headline">{part.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed mb-4">{part.content}</p>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <span className="flex items-center text-sm font-semibold">
                      <Languages className="mr-2 h-4 w-4" /> Show Translation & Analysis
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <p className="text-base italic text-muted-foreground">{part.translation}</p>
                    <Button variant="secondary" size="sm" onClick={() => handleTranslationAnalysis(part)}>
                       Ask Gemini about this translation
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {story.glossary.length > 0 && (
        <>
          <Button 
            className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20" 
            size="icon" 
            onClick={() => setIsGlossaryOpen(true)}
            aria-label="Open Glossary"
          >
            <HelpCircle className="h-8 w-8" />
          </Button>

          <Dialog open={isGlossaryOpen} onOpenChange={setIsGlossaryOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="font-headline">Glossary</DialogTitle>
                <DialogDescription>Key terms from your story. Click a term for a grammar explanation.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-4 -mr-6">
                <ul className="space-y-4">
                  {story.glossary.map((item, index) => (
                    <li key={index} className="flex items-start justify-between p-3 rounded-md border hover:bg-muted/50">
                      <div>
                        <p className="font-semibold">{item.word}</p>
                        <p className="text-sm text-muted-foreground">{item.definition}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleGrammarExplanation(item.word)}>
                        Explain Grammar
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
      
      <Dialog open={isGrammarDialogOpen || isAnalysisDialogOpen} onOpenChange={isGrammarDialogOpen ? setIsGrammarDialogOpen : setIsAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-headline">{modalContent.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {modalContent.isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">{modalContent.content}</pre>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
