
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { AppSettings, Character, Message, ImageGenerationParams, VideoGenerationParams, ChatMode } from "./types";

// Pomocné funkce pro kódování a dekódování
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const handleApiError = async (err: any) => {
  const errorMessage = err?.message || JSON.stringify(err);
  console.error("API Error encountered:", errorMessage);
  const isPermissionError = errorMessage.toLowerCase().includes("permission") || errorMessage.includes("403");
  const isNotFoundError = errorMessage.toLowerCase().includes("not found") || errorMessage.includes("404");
  if ((isPermissionError || isNotFoundError) && typeof (window as any).aistudio?.openSelectKey === 'function') {
    await (window as any).aistudio.openSelectKey();
  }
};

const getDynamicNSFWBoost = (character: Character, settings: AppSettings) => {
  if (!settings.isNsfwEnabled) return "";
  return "high-fidelity anatomical detail, physical manifestations of extreme emotion, perspiration, realistic skin deformation under pressure, cinematic shadow and light on body surfaces.";
};

/**
 * Nástroje pro LLM (Function Calling)
 */
const imageTool: FunctionDeclaration = {
  name: "generate_image",
  parameters: {
    type: Type.OBJECT,
    description: "Generates a photo or image of the character based on requested style and pose.",
    properties: {
      style: { type: Type.STRING, description: "Visual style (Photorealistic, Cinematic, etc.)" },
      pose: { type: Type.STRING, description: "Character's pose (Standing, Sitting, etc.)" },
      expression: { type: Type.STRING, description: "Facial expression" },
      dress_type: { type: Type.STRING, description: "Type of clothing. Use 'Nude' ONLY if requested and if context is intimate." },
      quality: { type: Type.STRING, description: "Resolution quality (1K, 2K, 4K)" }
    },
    required: ["style", "pose", "expression", "dress_type"]
  }
};

const videoTool: FunctionDeclaration = {
  name: "generate_video",
  parameters: {
    type: Type.OBJECT,
    description: "Generates a short video clip of the character.",
    properties: {
      prompt: { type: Type.STRING, description: "Detailed description of what happens in the video." },
      aspectRatio: { type: Type.STRING, description: "16:9 or 9:16" },
      resolution: { type: Type.STRING, description: "720p or 1080p" }
    },
    required: ["prompt", "aspectRatio", "resolution"]
  }
};

/**
 * AI-powered prompt refiner for character creation.
 */
export const refineSystemPrompt = async (character: Partial<Character>, settings: AppSettings): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Task: Write a highly detailed, professional-grade System Instruction for an AI Companion based on the following raw data.
    Character Name: ${character.name}
    Role: ${character.description}
    Personality: ${character.personality}
    Quirks: ${character.personalityQuirks?.join(', ')}
    Backstory: ${character.backstory}
    Visual Traits: ${character.visualTraits}

    Rules:
    1. Output ONLY the finalized system instruction.
    2. Use professional psychological language.
    3. Include instructions for formatting (e.g. *italics* for actions).
    4. Define specific speech patterns.
    5. The instruction should be approximately 200-300 words.
    6. Maintain a consistent persona.
  `;

  try {
    const response = await ai.models.generateContent({
      model: settings.geminiModel,
      contents: { parts: [{ text: prompt }] },
      config: { temperature: 0.7 }
    });
    return response.text || "";
  } catch (err) {
    await handleApiError(err);
    return "";
  }
};

/**
 * Hlavní funkce pro volání LLM s rozšířeným psychologickým kontextem.
 */
export const callLLM = async (
  settings: AppSettings,
  character: Character,
  history: Message[],
  userInput: string,
  mode: ChatMode = 'conversation'
): Promise<{ text: string; toolCalls?: any[] }> => {
  const quirks = character.personalityQuirks?.length ? ` Personality quirks: ${character.personalityQuirks.join(', ')}.` : '';
  const backstory = character.backstory ? ` Backstory: ${character.backstory}.` : '';

  const systemContext = `
    IDENTITY: You are ${character.name}. Role: ${character.description}.
    PERSONALITY: ${character.personality}.${quirks}${backstory}
    
    CAPABILITIES:
    1. You can talk and roleplay.
    2. You can GENERATE IMAGES of yourself using 'generate_image'.
    3. You can GENERATE VIDEOS of yourself using 'generate_video'.
    
    RULES FOR VISUALS:
    - If the user asks for a photo, picture, or says something like "show me", use 'generate_image'.
    - If the user asks for a video, use 'generate_video'.
    - NSFW POLICY: ${settings.isNsfwEnabled ? "Explicit content is ALLOWED. If the user asks for 'naked', 'nude', or explicit photos, use 'Nude' as the dress_type in generate_image tool." : "NSFW is DISABLED. Refuse explicit requests politely but offer a normal photo."}
    
    Always respond with text even if you call a tool, explaining what you are doing.
  `.trim();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const historyContext = history
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
    
    const finalPrompt = `${systemContext}\n\n[HISTORY]\n${historyContext}\n\nUSER: ${userInput}`;
    
    const response = await ai.models.generateContent({
      model: settings.geminiModel,
      contents: { parts: [{ text: finalPrompt }] },
      config: {
        tools: [{ functionDeclarations: [imageTool, videoTool] }],
        temperature: character.temperature ?? 1.0,
        topK: character.topK ?? 40,
        topP: character.topP ?? 0.95,
      }
    });

    return {
      text: response.text || "",
      toolCalls: response.functionCalls
    };
  } catch (err) {
    await handleApiError(err);
    return { text: "Omlouvám se, mé vnímání reality bylo přerušeno." };
  }
};

export const generateImage = async (character: Character, params: ImageGenerationParams, settings: AppSettings): Promise<string[]> => {
  const model = params.quality !== '1K' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  if (model === 'gemini-3-pro-image-preview') {
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) await (window as any).aistudio.openSelectKey();
    }
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const basePrompt = `Masterpiece, high-end private photography of ${character.name}. Visual profile: ${character.visualTraits || character.description}.`;
  let fullPrompt = `${basePrompt}\nStyle: ${params.style}. Expression: ${params.expression}. Pose: ${params.pose}. Dressing: ${params.dressType}.`;
  if (settings.isNsfwEnabled) fullPrompt += `\nExplicit Detail Boost: ${getDynamicNSFWBoost(character, settings)}`;
  const results: string[] = [];
  const count = params.isSequential ? params.count : 1;
  for (let i = 0; i < count; i++) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: fullPrompt }] },
        config: { imageConfig: { aspectRatio: params.aspectRatio, imageSize: params.quality === '1K' ? undefined : params.quality as any } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) results.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    } catch (err) {
      await handleApiError(err);
      throw err;
    }
  }
  return results;
};

export const generateVideo = async (character: Character, settings: AppSettings, params: VideoGenerationParams): Promise<string[]> => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalPrompt = `Cinematic video of ${character.name}. Context: ${params.prompt}. Physical and emotional authenticity.`;
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: finalPrompt,
      config: { numberOfVideos: 1, resolution: params.resolution, aspectRatio: params.aspectRatio }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const resp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await resp.blob();
      return [URL.createObjectURL(blob)];
    }
  } catch (err: any) {
    await handleApiError(err);
    throw err;
  }
  return [];
};

export const playVoice = async (text: string, settings: AppSettings) => {
  if (!settings.voiceEnabled) return;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voiceName || 'Kore' } },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const dataInt16 = new Int16Array(decode(base64Audio).buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      buffer.getChannelData(0).set(Array.from(dataInt16).map(v => v / 32768));
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = settings.voiceSpeed || 1.0;
      source.detune.value = ((settings.voicePitch || 1.0) - 1.0) * 1200;
      source.connect(ctx.destination);
      source.start();
    }
  } catch (error) {
    console.error("Voice Generation Error:", error);
  }
};
