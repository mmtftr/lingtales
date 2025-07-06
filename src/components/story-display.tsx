
"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, HelpCircle, Languages, Loader2, ChevronRight, Send, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage, ArchivedStory, ExplainPhraseInput } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/use-user-settings";
import { generateGrammarExplanation } from "@/ai/flows/generate-grammar-explanation";
import { analyzeTranslationPair } from "@/ai/flows/analyze-translation-pair";
import { explainPhrase } from "@/ai/flows/explain-phrase";
import { LinguaTalesIcon } from "@/components/icons";

interface StoryDisplayProps {
  story: ArchivedStory;
  onContinueStory: () => Promise<void>;
  isGeneratingMore: boolean;
}

export function StoryDisplay({ story, onContinueStory, isGeneratingMore }: StoryDisplayProps) {
  const { toast } = useToast();
  const [userSettings] = useUserSettings();
  
  const [isGrammarDialogOpen, setIsGrammarDialogOpen] = useState(false);
  const [grammarModalContent, setGrammarModalContent] = useState({ title: "", content: "", isLoading: false });

  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState<typeof story.storyParts[0] | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  const [explanationState, setExplanationState] = useState<{
    open: boolean;
    content: string;
    isLoading: boolean;
    targetRect: DOMRect | null;
    selectedPhrase: string;
    context: string;
  }>({ open: false, content: '', isLoading: false, targetRect: null, selectedPhrase: '', context: '' });


  const handleMouseUp = (partContent: string) => {
    const selection = window.getSelection();
    if (selection && selection.type === 'Range') {
        const selectedText = selection.toString().trim();
        if (selectedText.length > 2 && selectedText !== explanationState.selectedPhrase) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setExplanationState({
                open: true,
                content: '',
                isLoading: true,
                targetRect: {...rect, width: rect.width, x: window.scrollX + rect.left, y: window.scrollY + rect.y},
                selectedPhrase: selectedText,
                context: partContent,
            });
        }
    }
  };

  const handleExplanationOpenChange = (open: boolean) => {
    if (!open) {
      setExplanationState({ open: false, content: '', isLoading: false, targetRect: null, selectedPhrase: '', context: '' });
      window.getSelection()?.removeAllRanges();
    }
  };

  useEffect(() => {
    if (explanationState.isLoading && explanationState.selectedPhrase) {
      const params: ExplainPhraseInput = {
        phrase: explanationState.selectedPhrase,
        context: explanationState.context,
        sourceLanguage: story.params.sourceLanguage,
        targetLanguage: story.params.targetLanguage,
        apiKey: userSettings.apiKey,
      };
      explainPhrase(params)
        .then(result => {
          setExplanationState(prev => ({ ...prev, content: result.explanation, isLoading: false }));
        })
        .catch(error => {
          console.error("Error fetching explanation:", error);
          setExplanationState(prev => ({ ...prev, content: "Sorry, an error occurred while fetching the explanation.", isLoading: false }));
        });
    }
  }, [explanationState.isLoading, explanationState.selectedPhrase, explanationState.context, story.params.sourceLanguage, story.params.targetLanguage, userSettings.apiKey]);


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
      const result = await generateGrammarExplanation({ wordOrPhrase: word, language: story.params.targetLanguage, apiKey: userSettings.apiKey });
      setGrammarModalContent((prev) => ({ ...prev, content: result.explanation, isLoading: false }));
    } catch (error) {
      console.error(error);
      setGrammarModalContent((prev) => ({ ...prev, content: "Failed to load explanation.", isLoading: false }));
    }
  };

  const handleTranslationAnalysis = (part: typeof story.storyParts[0]) => {
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
        apiKey: userSettings.apiKey,
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
              <CardDescription>Your personalized story in {story.params.targetLanguage}.</CardDescription>
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
              <p className="text-lg leading-relaxed mb-4" onMouseUp={() => handleMouseUp(part.content)}>{part.content}</p>
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
            <Button onClick={onContinueStory} disabled={isGeneratingMore || !userSettings.apiKey}>
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
                      <Button variant="ghost" size="sm" onClick={() => handleGrammarExplanation(item.word)} disabled={!userSettings.apiKey}>
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
                        disabled={isSendingMessage || !userSettings.apiKey}
                        autoFocus
                    />
                    <Button type="submit" size="icon" disabled={isSendingMessage || !chatInput.trim() || !userSettings.apiKey}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                    </Button>
                </div>
            </form>
        </DialogContent>
      </Dialog>

      <Popover open={explanationState.open} onOpenChange={handleExplanationOpenChange}>
        {explanationState.targetRect && (
          <PopoverAnchor
            style={{
              position: 'absolute',
              top: explanationState.targetRect.y,
              left: explanationState.targetRect.x + explanationState.targetRect.width / 2,
            }}
          />
        )}
        <PopoverContent className="max-w-80" side="bottom" align="center">
          {explanationState.isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <p className="text-sm">{explanationState.content}</p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
