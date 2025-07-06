
"use client";

import { useLocalStorage } from './use-local-storage';

export interface UserSettings {
    sourceLanguage: string;
    targetLanguage: string;
    level: string;
}

const defaultSettings: UserSettings = {
    sourceLanguage: 'English',
    targetLanguage: '',
    level: '',
};

export function useUserSettings() {
    const [settings, setSettings] = useLocalStorage<UserSettings>('user-settings', defaultSettings);
    return [settings, setSettings] as const;
}
