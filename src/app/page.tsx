"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

import { generateKeywords } from "@/ai/flows/generate-keywords";
import { generateStory } from "@/ai/flows/generate-story";
import { StoryLearnerIcon } from "@/components/icons";
import { SettingsDialog } from "@/components/settings-dialog";
import { StoryArchive } from "@/components/story-archive";
import { StoryDisplay } from "@/components/story-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStoryArchive } from "@/hooks/use-story-archive";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/use-user-settings";
import type { ArchivedStory, GenerateStoryInput } from "@/lib/types";

const genres = [
  "Action",
  "Adventure",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Historical Fiction",
  "Horror",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "Epic Fantasy",
  "Urban Fantasy",
  "Steampunk",
];

const generatorFormSchema = z.object({
  genre: z.string().min(1, "Please select a genre."),
  prompt: z.string().min(10, "Prompt must be at least 10 characters long."),
});
type GeneratorFormValues = z.infer<typeof generatorFormSchema>;

export default function Home() {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [activeStory, setActiveStory] = useState<ArchivedStory | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);

  const { toast } = useToast();
  const [userSettings, setUserSettings] = useUserSettings();
  const { archivedStories, addStory, updateStory, clearArchive } =
    useStoryArchive();

  const generatorForm = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorFormSchema),
    defaultValues: { genre: "", prompt: "" },
  });

  const isMissingSettings =
    !userSettings.targetLanguage || !userSettings.level || !userSettings.apiKey;

  useEffect(() => {
    if (isMissingSettings) {
      setIsSettingsOpen(true);
    } else if (archivedStories.length === 0) {
      setIsGeneratorOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!activeStory && archivedStories.length > 0) {
      setActiveStory(archivedStories[0]);
    }
  }, [archivedStories, activeStory]);

  const handleGenerateKeywords = useCallback(
    async (isAuto = false) => {
      const { genre } = generatorForm.getValues();
      const { targetLanguage, apiKey } = userSettings;
      if (!genre || !targetLanguage || !apiKey) {
        if (!isAuto) {
          toast({
            variant: "destructive",
            title: "Missing fields",
            description:
              "Please set your language, API key and select a genre to generate keywords.",
          });
        }
        return;
      }
      setIsGeneratingKeywords(true);
      setKeywords([]);
      try {
        const result = await generateKeywords({
          genre,
          targetLanguage,
          apiKey,
        });
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
    },
    [generatorForm, userSettings, toast]
  );

  const watchedGenre = generatorForm.watch("genre");

  useEffect(() => {
    if (userSettings.targetLanguage && watchedGenre && userSettings.apiKey) {
      handleGenerateKeywords(true);
    } else {
      setKeywords([]);
    }
  }, [
    userSettings.targetLanguage,
    watchedGenre,
    userSettings.apiKey,
    handleGenerateKeywords,
  ]);

  const addKeywordToPrompt = (keyword: string) => {
    const currentPrompt = generatorForm.getValues("prompt");
    generatorForm.setValue(
      "prompt",
      currentPrompt ? `${currentPrompt}, ${keyword}` : keyword
    );
  };

  const handleGenerateStory: SubmitHandler<GeneratorFormValues> = async (
    data
  ) => {
    setIsGeneratingStory(true);
    setActiveStory(null);

    const finalParams: GenerateStoryInput = {
      ...data,
      sourceLanguage: userSettings.sourceLanguage,
      targetLanguage: userSettings.targetLanguage,
      level: userSettings.level,
      apiKey: userSettings.apiKey,
    };

    try {
      const result = await generateStory(finalParams);
      const newStory = addStory(result, finalParams);
      setActiveStory(newStory);
      setKeywords([]);
      setIsGeneratorOpen(false);
      generatorForm.reset();
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

  const handleContinueStory = async () => {
    if (!activeStory) return;

    setIsGeneratingMore(true);
    try {
      const result = await generateStory({
        ...activeStory.params,
        storyHistory: activeStory.storyParts,
        apiKey: userSettings.apiKey,
      });

      const newStoryParts = [...activeStory.storyParts, ...result.storyParts];

      const existingGlossaryWords = new Set(
        activeStory.glossary.map((item) => item.word)
      );
      const newGlossaryItems = result.glossary.filter(
        (item) => !existingGlossaryWords.has(item.word)
      );
      const newGlossary = [...activeStory.glossary, ...newGlossaryItems];

      const updatedStory: ArchivedStory = {
        ...activeStory,
        storyParts: newStoryParts,
        glossary: newGlossary,
      };

      setActiveStory(updatedStory);
      updateStory(updatedStory);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error continuing story",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleSelectStory = (story: ArchivedStory) => {
    setActiveStory(story);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <StoryLearnerIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold text-primary truncate">
              StoryLearner
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button size="sm" onClick={() => setIsGeneratorOpen(true)}>
              <Sparkles className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">New Story</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        {(isGeneratingStory || isGeneratingMore) && !activeStory && (
          <div className="flex flex-col items-center justify-center h-full rounded-lg border border-dashed p-8 text-center animate-pulse">
            <StoryLearnerIcon className="h-16 w-16 text-muted-foreground/50" />
            <p className="font-headline text-xl mt-4 text-muted-foreground">
              Crafting your story...
            </p>
            <p className="text-muted-foreground mt-2">
              The AI is weaving words and grammar into a unique tale for you.
              Please wait.
            </p>
          </div>
        )}

        {!isGeneratingStory && activeStory && (
          <StoryDisplay
            story={activeStory}
            onContinueStory={handleContinueStory}
            isGeneratingMore={isGeneratingMore}
          />
        )}

        {!isGeneratingStory && !isGeneratingMore && !activeStory && (
          <div className="flex flex-col items-center justify-center h-full rounded-lg border border-dashed p-8 text-center">
            <StoryLearnerIcon className="h-16 w-16 text-muted-foreground/50" />
            <p className="font-headline text-xl mt-4 text-muted-foreground">
              Your story awaits
            </p>
            <p className="text-muted-foreground mt-2">
              Click 'New Story' to begin your language learning adventure or
              select a story from your library below.
            </p>
          </div>
        )}

        <StoryArchive
          stories={archivedStories}
          onSelectStory={handleSelectStory}
          onClearArchive={clearArchive}
        />
      </main>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onSave={setUserSettings}
        defaultValues={userSettings}
      />

      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              Create Your Story
            </DialogTitle>
            <DialogDescription>
              {isMissingSettings
                ? "Please complete your settings before generating a story."
                : `Using language ${userSettings.targetLanguage} at level ${userSettings.level}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Form {...generatorForm}>
              <form
                onSubmit={generatorForm.handleSubmit(handleGenerateStory)}
                className="space-y-6"
              >
                <FormField
                  control={generatorForm.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a genre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genres.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generatorForm.control}
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
                          disabled={
                            isGeneratingKeywords ||
                            !watchedGenre ||
                            !userSettings.targetLanguage ||
                            !userSettings.apiKey
                          }
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
                        <Textarea
                          placeholder="e.g., A brave knight looking for a lost dragon..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {keywords.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Click a keyword to add it to your prompt:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw) => (
                        <Badge
                          key={kw}
                          variant="secondary"
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => addKeywordToPrompt(kw)}
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isGeneratingStory || isMissingSettings}
                  className="w-full"
                >
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
