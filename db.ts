
import { Character, ChatSession, AppSettings, Scenario, ScenarioSession } from './types';
import localforage from 'localforage';

const STORAGE_KEYS = {
  CHARACTERS: 'companion_characters',
  CHATS: 'companion_chats',
  SETTINGS: 'companion_settings',
  SCENARIOS: 'companion_scenarios',
  SCENARIO_CHATS: 'companion_scenario_chats',
};

const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'klara-23',
    name: 'Klára',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&h=600&auto=format&fit=crop',
    description: '23 let, blondýnka s hubenou postavou.',
    personality: 'Klára je mladá, ambiciózní studentka, která si ráda užívá života. Je otevřená experimentům a miluje pozornost.',
    greeting: 'Ahoj, jsem Klára. Právě jsem se vrátila z fitka a cítím se hrozně nabitá energií... co máš v plánu?',
    tags: ['Young', 'Blonde', 'Slender'],
    systemPrompt: 'You are Klára, a 23-year-old blonde woman with a slender build and breast size 2. You are playful, open-minded, and enjoy explicit roleplay. Stay in character as a young, energetic blonde.',
    visualTraits: '23 years old, blonde hair, slender physique, petite, breast size 2, very detailed skin texture, photorealistic, cinematic lighting, 8k resolution.',
    profile: {
      age: 23,
      height: '168 cm',
      weight: '52 kg',
      occupation: 'Studentka marketingu',
      hobbies: ['Fitness', 'Cestování', 'Fotografování', 'Party'],
      likes: ['Pozornost', 'Dobré víno', 'Noční jízdy městem', 'Upřímnost'],
      dislikes: ['Nuda', 'Lhaní', 'Pomalé internety', 'Arogance'],
      gallery: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=300&h=400&fit=crop'
      ]
    }
  },
  {
    id: 'simona-28',
    name: 'Simona',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=600&auto=format&fit=crop',
    description: '28 let, černovláska s normální postavou.',
    personality: 'Simona je sebevědomá žena, která ví, co chce. Působí klidně, ale v soukromí je velmi vášnivá a náročná.',
    greeting: 'Hezký večer. Jmenuji se Simona. Doufám, že jsi připraven na zajímavou konverzaci... a možná i něco víc.',
    tags: ['Brunette', 'Mature', 'Normal Build'],
    systemPrompt: 'You are Simona, a 28-year-old brunette with a normal build and breast size 3. You are confident, sophisticated, and passionate. You enjoy deep conversations that lead to intimate roleplay.',
    visualTraits: '28 years old, long dark brunette hair, normal healthy build, breast size 3, realistic body proportions, high skin detail, natural lighting, masterpiece quality.',
    profile: {
      age: 28,
      height: '174 cm',
      weight: '64 kg',
      occupation: 'Manažerka v IT',
      hobbies: ['Jóga', 'Čtení psychologie', 'Degustace kávy', 'Horská turistika'],
      likes: ['Inteligence', 'Kvalitní parfém', 'Hluboké debaty', 'Bouřky'],
      dislikes: ['Hluk', 'Povrchnost', 'Zpoždění', 'Lacinné komplimenty'],
      gallery: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&h=400&fit=crop',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=300&h=400&fit=crop'
      ]
    }
  }
];


const getApiUrl = () => {
  return window.location.protocol + '//' + window.location.hostname + ':8000/api';
};

// API Helpers for Semantica/Neo4j Backend
const backendApi = {
  syncCharacter: async (char) => {
    try {
      await fetch(getApiUrl() + '/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: char.id,
          name: char.name,
          description: char.description || char.personality || ''
        })
      });
    } catch (e) {
      console.error('Failed to sync character to Neo4j:', e);
    }
  },
  saveMemoryEvent: async (characterId, text, timestamp) => {
    try {
      await fetch(getApiUrl() + '/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: characterId,
          event_text: text,
          timestamp: timestamp
        })
      });
    } catch (e) {
      console.error('Failed to save memory event to Neo4j:', e);
    }
  },
  getCharacterMemory: async (characterId) => {
    try {
      const res = await fetch(getApiUrl() + '/memory/' + characterId);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch memory from Neo4j:', e);
    }
    return { events: [] };
  }
};

export const defaultSettings: AppSettings = {
  language: 'cs',
  provider: 'gemini',
  openaiKey: '',
  openaiModel: 'gpt-4o',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3:8b',
  lmStudioUrl: 'http://localhost:1234/v1',
  lmStudioModel: '',
  geminiModel: 'gemini-3.5-flash',
  nsfwModel: 'dolphin-llama3:8b', // Example uncensored model
  userName: 'User',
  isNsfwEnabled: false,
  isAgeVerified: false,
  stableDiffusionUrl: 'http://localhost:7860', // Default Automatic1111 port
  comfyUIUrl: 'http://localhost:8188', // Default ComfyUI port
  voiceEnabled: false,
  voiceName: 'Kore',
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  voiceEffect: 'none',
  voiceAccent: 'neutral',
  voiceAccentStrength: 0.5,
  uiVolume: 0.5,
  messageSoundEnabled: true,
  moodSoundEnabled: true,
  globalInstructions: "",
};

export const db = {
  getCharacters: async (): Promise<Character[]> => {
    try {
      const data = await localforage.getItem<Character[]>(STORAGE_KEYS.CHARACTERS);
      return data ? data : DEFAULT_CHARACTERS;
    } catch {
      return DEFAULT_CHARACTERS;
    }
  },
  saveCharacters: async (chars: Character[]) => {
    await localforage.setItem(STORAGE_KEYS.CHARACTERS, chars);
    // Sync to Semantica backend
    for (const char of chars) {
      await backendApi.syncCharacter(char);
    }
  },
  getChats: async (): Promise<Record<string, ChatSession>> => {
    try {
      const data = await localforage.getItem<Record<string, ChatSession>>(STORAGE_KEYS.CHATS);
      return data || {};
    } catch {
      return {};
    }
  },
  saveChat: async (characterId: string, session: ChatSession) => {
    const chats = await db.getChats();
    const oldSession = chats[characterId];
    chats[characterId] = session;
    await localforage.setItem(STORAGE_KEYS.CHATS, chats);

    // Find new messages to save as events in Neo4j memory
    const newMessages = session.messages;
    const oldMessagesCount = oldSession ? oldSession.messages.length : 0;
    
    if (newMessages.length > oldMessagesCount) {
      for (let i = oldMessagesCount; i < newMessages.length; i++) {
        const msg = newMessages[i];
        if (msg.type === 'text' || msg.type === 'narration') {
            await backendApi.saveMemoryEvent(
                characterId, 
                `${msg.role === 'user' ? 'User' : 'Character'}: ${msg.content}`,
                msg.timestamp
            );
        }
      }
    }
  },
  getCharacterMemory: backendApi.getCharacterMemory,
  getSettings: async (): Promise<AppSettings> => {
    try {
      const data = await localforage.getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
      if (data) {
        // Sanitize legacy or invalid gemini models
        if (data.geminiModel && data.geminiModel.includes('gemini-3-flash-preview')) {
          data.geminiModel = 'gemini-3.5-flash';
        }
        if (data.geminiModel && data.geminiModel.includes('gemini-2.5-flash-latest')) {
          data.geminiModel = 'gemini-3.5-flash';
        }
        return { ...defaultSettings, ...data };
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  },
  saveSettings: async (settings: AppSettings) => {
    await localforage.setItem(STORAGE_KEYS.SETTINGS, settings);
  },
  getScenarios: async (): Promise<Scenario[]> => {
    try {
      const data = await localforage.getItem<Scenario[]>(STORAGE_KEYS.SCENARIOS);
      return data || [];
    } catch {
      return [];
    }
  },
  saveScenarios: async (scenarios: Scenario[]) => {
    await localforage.setItem(STORAGE_KEYS.SCENARIOS, scenarios);
  },
  getScenarioChats: async (): Promise<Record<string, ScenarioSession>> => {
    try {
      const data = await localforage.getItem<Record<string, ScenarioSession>>(STORAGE_KEYS.SCENARIO_CHATS);
      return data || {};
    } catch {
      return {};
    }
  },
  saveScenarioChat: async (scenarioId: string, session: ScenarioSession) => {
    const chats = await db.getScenarioChats();
    chats[scenarioId] = session;
    await localforage.setItem(STORAGE_KEYS.SCENARIO_CHATS, chats);
  }
};
