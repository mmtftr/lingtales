
"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, HelpCircle, Languages, Loader2, ChevronRight, Send, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GenerateStoryOutput, StoryPart, ChatMessage, ArchivedStory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { generateGrammarExplanation } from "@/ai/flows/generate-grammar-explanation";
import { analyzeTranslationPair } from "@/ai/flows/analyze-translation-pair";
import { LinguaTalesIcon } from "@/components/icons";

interface StoryDisplayProps {
  story: ArchivedStory;
  targetLanguage: string;
  onContinueStory: () => Promise<void>;
  isGeneratingMore: boolean;
}

export function StoryDisplay({ story, targetLanguage, onContinueStory, isGeneratingMore }: StoryDisplayProps) {
  const { toast } = useToast();
  
  const [isGrammarDialogOpen, setIsGrammarDialogOpen] = useState(false);
  const [grammarModalContent, setGrammarModalContent] = useState({ title: "", content: "", isLoading: false });

  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState<StoryPart | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

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
    setGrammarModalContent({ title: `Grammar: "${word}"`, content: "", isLoading: true });
    try {
      const result = await generateGrammarExplanation({ wordOrPhrase: word, language: targetLanguage });
      setGrammarModalContent((prev) => ({ ...prev, content: result.explanation, isLoading: false }));
    } catch (error) {
      console.error(error);
      setGrammarModalContent((prev) => ({ ...prev, content: "Failed to load explanation.", isLoading: false }));
    }
  };

  const handleTranslationAnalysis = (part: StoryPart) => {
    setAnalysisTarget(part);
    setChatMessages([]);
    setChatInput("");
    setIsAnalysisDialogOpen(true);
  };
  
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatInput.trim() || !analysisTarget) return;

    const newUserMessage: ChatMessage = { role: "user", content: chatInput };
    const newMessages: ChatMessage[] = [...chatMessages, newUserMessage];
    
    setChatMessages(newMessages);
    setChatInput("");
    setIsSendingMessage(true);

    try {
      const result = await analyzeTranslationPair({
        sourcePhrase: analysisTarget.content,
        targetPhrase: analysisTarget.translation,
        history: newMessages,
      });
      setChatMessages([...newMessages, { role: "model", content: result.response }]);
    } catch (error) {
      console.error(error);
      setChatMessages([...newMessages, { role: "model", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsSendingMessage(false);
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
      
       <div className="mt-6 flex justify-center">
            <Button onClick={onContinueStory} disabled={isGeneratingMore}>
                {isGeneratingMore ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate More
                    </>
                )}
            </Button>
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
      
      <Dialog open={isGrammarDialogOpen} onOpenChange={setIsGrammarDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-headline">{grammarModalContent.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {grammarModalContent.isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
                <div className="prose dark:prose-invert max-w-none p-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{grammarModalContent.content}</ReactMarkdown>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="font-headline">Ask Gemini about the translation</DialogTitle>
                {analysisTarget && <DialogDescription>"{analysisTarget.title}"</DialogDescription>}
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-4 -mr-4">
                <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                        {chatMessages.map((message, index) => (
                            <div key={index} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {message.role === 'model' && <LinguaTalesIcon className="h-6 w-6 text-primary shrink-0"/>}
                                <div className={`rounded-lg p-3 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-current">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {message.content}
                                      </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isSendingMessage && (
                            <div className="flex items-end gap-2 justify-start">
                                <LinguaTalesIcon className="h-6 w-6 text-primary shrink-0"/>
                                <div className="rounded-lg p-3 bg-muted flex items-center">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <form onSubmit={handleSendMessage} className="mt-4">
                <div className="flex gap-2">
                    <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask a question..."
                        disabled={isSendingMessage}
                        autoFocus
                    />
                    <Button type="submit" size="icon" disabled={isSendingMessage || !chatInput.trim()}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                    </Button>
                </div>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
