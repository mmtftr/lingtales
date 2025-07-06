
"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateKeywords } from "@/ai/flows/generate-keywords";
import { generateStory } from "@/ai/flows/generate-story";
import type { GenerateStoryOutput } from "@/ai/flows/generate-story";
import { StoryDisplay } from "@/components/story-display";
import { LinguaTalesIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

const sourceLanguages = ["English", "French", "German", "Spanish", "Turkish"];
const languages = ["English", "French", "German", "Italian", "Japanese", "Portuguese", "Spanish"];
const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
const genres = ["Fantasy", "Science Fiction", "Mystery", "Romance", "Adventure", "Historical Fiction", "Fairy Tale"];

const formSchema = z.object({
  sourceLanguage: z.string().min(1, "Please select a source language."),
  targetLanguage: z.string().min(1, "Please select a language."),
  level: z.string().min(1, "Please select a level."),
  genre: z.string().min(1, "Please select a genre."),
  prompt: z.string().min(10, "Prompt must be at least 10 characters long."),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(true);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [story, setStory] = useState<GenerateStoryOutput | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceLanguage: "English",
      targetLanguage: "",
      level: "",
      genre: "",
      prompt: "",
    },
  });

  const handleGenerateKeywords = useCallback(async (isAuto = false) => {
    const { genre, targetLanguage } = form.getValues();
    if (!genre || !targetLanguage) {
      if (!isAuto) {
        toast({
          variant: "destructive",
          title: "Missing fields",
          description: "Please select a language and genre to generate keywords.",
        });
      }
      return;
    }
    setIsGeneratingKeywords(true);
    setKeywords([]);
    try {
      const result = await generateKeywords({ genre, targetLanguage });
      setKeywords(result.keywords);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error generating keywords",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGeneratingKeywords(false);
    }
  }, [form, toast]);

  const targetLanguageValue = form.watch("targetLanguage");
  const genreValue = form.watch("genre");

  useEffect(() => {
    if (targetLanguageValue && genreValue) {
      handleGenerateKeywords(true);
    } else {
      setKeywords([]);
    }
  }, [targetLanguageValue, genreValue, handleGenerateKeywords]);

  const addKeywordToPrompt = (keyword: string) => {
    const currentPrompt = form.getValues("prompt");
    form.setValue("prompt", currentPrompt ? `${currentPrompt}, ${keyword}` : keyword);
  };

  const handleGenerateStory: SubmitHandler<FormValues> = async (data) => {
    setIsGeneratingStory(true);
    setStory(null);
    try {
      const result = await generateStory(data);
      setStory(result);
      setCurrentLanguage(data.targetLanguage);
      setKeywords([]);
      setIsGeneratorOpen(false);
      form.setValue("prompt", "");
      form.setValue("genre", "");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error generating story",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LinguaTalesIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold text-primary">LinguaTales</h1>
          </div>
          <Button onClick={() => setIsGeneratorOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            New Story
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {isGeneratingStory && (
          <div className="flex flex-col items-center justify-center h-full rounded-lg border border-dashed p-8 text-center animate-pulse">
              <LinguaTalesIcon className="h-16 w-16 text-muted-foreground/50" />
              <p className="font-headline text-xl mt-4 text-muted-foreground">Crafting your story...</p>
              <p className="text-muted-foreground mt-2">The AI is weaving words and grammar into a unique tale for you. Please wait.</p>
          </div>
        )}
        {!isGeneratingStory && story && (
            <StoryDisplay story={story} targetLanguage={currentLanguage} />
        )}
        {!isGeneratingStory && !story && (
             <div className="flex flex-col items-center justify-center h-full rounded-lg border border-dashed p-8 text-center">
                <LinguaTalesIcon className="h-16 w-16 text-muted-foreground/50" />
                <p className="font-headline text-xl mt-4 text-muted-foreground">Your story awaits</p>
                <p className="text-muted-foreground mt-2">Click 'New Story' above to begin your language learning adventure.</p>
            </div>
        )}
      </main>

      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Create Your Story</DialogTitle>
            <DialogDescription>Fill in the details below to generate your personalized language-learning tale.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateStory)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="sourceLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sourceLanguages.map((lang) => (
                              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language to Learn</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level (CEFR)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {levels.map((level) => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a genre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genres.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex justify-between items-center">
                        <FormLabel>Story Prompt</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateKeywords(false)}
                          disabled={isGeneratingKeywords || !targetLanguageValue || !genreValue}
                        >
                          {isGeneratingKeywords ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Suggest Keywords
                        </Button>
                       </div>
                      <FormControl>
                        <Textarea placeholder="e.g., A brave knight looking for a lost dragon..." {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {keywords.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Click a keyword to add it to your prompt:</p>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="cursor-pointer hover:bg-accent" onClick={() => addKeywordToPrompt(kw)}>
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button type="submit" disabled={isGeneratingStory} className="w-full">
                  {isGeneratingStory ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Your Tale...
                    </>
                  ) : (
                    "Generate Story"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
