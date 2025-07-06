
"use client";

import { useLocalStorage } from './use-local-storage';
import type { ArchivedStory, GenerateStoryOutput, GenerateStoryInput } from '@/lib/types';

export function useStoryArchive() {
    const [archivedStories, setArchivedStories] = useLocalStorage<ArchivedStory[]>('story-archive', []);

    const addStory = (story: GenerateStoryOutput, params: GenerateStoryInput): ArchivedStory => {
        const newArchivedStory: ArchivedStory = {
            ...story,
            id: new Date().toISOString(),
            params: params,
            createdAt: new Date().toISOString(),
        };
        setArchivedStories(prev => [newArchivedStory, ...prev]);
        return newArchivedStory;
    };

    const updateStory = (updatedStory: ArchivedStory) => {
        setArchivedStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
    }

    const clearArchive = () => {
        setArchivedStories([]);
    }

    return { archivedStories, addStory, updateStory, clearArchive };
}
