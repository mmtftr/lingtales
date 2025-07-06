"use client";

import type { ArchivedStory } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { BookOpen, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StoryArchiveProps {
  stories: ArchivedStory[];
  onSelectStory: (story: ArchivedStory) => void;
  onClearArchive: () => void;
}

export function StoryArchive({
  stories,
  onSelectStory,
  onClearArchive,
}: StoryArchiveProps) {
  if (stories.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-2xl">
            Your Story Library
          </CardTitle>
          <CardDescription>
            Revisit your previously generated stories.
          </CardDescription>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Library
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your saved stories. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearArchive}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-md border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold">{story.title}</p>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date(story.createdAt).toLocaleDateString()}{" "}
                  &bull; {story.params.targetLanguage} ({story.params.level})
                  &bull; {story.params.genre}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectStory(story)}
                className="w-full sm:w-auto"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Read Story
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
