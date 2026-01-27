
export type LLMProvider = 'openai' | 'ollama' | 'lmstudio' | 'gemini';
export type ChatMode = 'conversation' | 'scenario';
export type AppLanguage = 'cs' | 'en';
export type VoiceEffect = 'none' | 'echo' | 'reverb' | 'radio' | 'robotic';

export interface BodySpecs {
  height: number;      // 140-200
  shoulders: number;   // 0-100
  chest: number;       // 0-100
  waist: number;       // 0-100
  hips: number;        // 0-100
  legs: number;        // 0-100
  muscleTone: number;  // 0-100
}

export interface FaceSpecs {
  roundness: number;
  eyeSize: number;
  noseShape: number;
  lipsSize: number;
  jawline: number;
  forehead: number;
}

export interface CharacterProfile {
  age: number;
  height: string;
  weight: string;
  occupation: string;
  hobbies: string[];
  likes: string[];
  dislikes: string[];
  gallery: string[];
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  description: string;
  personality: string;
  greeting: string;
  tags: string[];
  systemPrompt: string;
  visualTraits: string;
  backstory?: string;
  personalityQuirks?: string[];
  bodySpecs?: BodySpecs;
  faceSpecs?: FaceSpecs;
  profile?: CharacterProfile;
  lastMessage?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'narration';
  mode?: ChatMode;
  mimeType?: string;
}

export interface ChatSession {
  characterId: string;
  messages: Message[];
  currentMode: ChatMode;
}

export interface AppSettings {
  language: AppLanguage;
  provider: LLMProvider;
  openaiKey: string;
  openaiModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  lmStudioUrl: string;
  geminiModel: string;
  userName: string;
  isNsfwEnabled: boolean;
  voiceEnabled: boolean;
  voiceName: string;
  voiceSpeed: number;
  voicePitch: number;
  voiceEffect: VoiceEffect;
}

export interface ImageGenerationParams {
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  quality: '1K' | '2K' | '4K';
  style: string;
  pose: string;
  expression: string;
  dressType: string;
  props: string[];
  isSequential: boolean;
  count: number;
  allAngles: boolean;
}

export interface VideoGenerationParams {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  startImage?: string; // base64
  endImage?: string;   // base64
  segments: number;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  icon: string;
  category: 'social' | 'cinematic' | 'experimental';
}
