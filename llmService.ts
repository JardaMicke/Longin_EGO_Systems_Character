

import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { AppSettings, Character, Message, ImageGenerationParams, VideoGenerationParams, ChatMode, BodySpecs, FaceSpecs, Scenario } from "./types";

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

const localTools = [
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generates a photo or image of the character based on requested style and pose.",
      parameters: {
        type: "object",
        properties: {
          style: { type: "string" },
          pose: { type: "string" },
          expression: { type: "string" },
          dress_type: { type: "string" },
          quality: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        },
        required: ["style", "pose", "expression", "dress_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_video",
      description: "Generates a short video clip of the character.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          aspectRatio: { type: "string" },
          resolution: { type: "string" }
        },
        required: ["prompt", "aspectRatio", "resolution"]
      }
    }
  }
];

const callLocalLLM = async (
  settings: AppSettings, 
  history: Message[], 
  systemPrompt: string,
  onProgress?: (text: string) => void
): Promise<{ text: string; toolCalls?: any[] }> => {
  const isLmStudio = !!settings.lmStudioUrl;
  const baseUrl = settings.lmStudioUrl || (settings.ollamaUrl ? `${settings.ollamaUrl}/v1` : '');
  
  if (!baseUrl) return { text: "" };

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.isNsfwEnabled ? settings.nsfwModel : (isLmStudio ? settings.openaiModel : settings.ollamaModel),
        messages,
        temperature: 0.7,
        tools: localTools,
        tool_choice: "auto",
        stream: !!onProgress
      }),
    });

    if (onProgress && resp.body) {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                fullText += data.choices[0].delta.content;
                onProgress(fullText);
              }
            } catch (e) {}
          }
        }
      }
      return { text: fullText };
    } else {
      const json = await resp.json();
      const message = json.choices?.[0]?.message;
      let toolCalls: any[] | undefined = undefined;
      
      if (message?.tool_calls?.length > 0) {
        toolCalls = message.tool_calls.map((tc: any) => ({
          name: tc.function.name,
          args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments
        }));
      }

      return { 
        text: message?.content || "", 
        toolCalls 
      };
    }
  } catch (e) {
    console.error("Local LLM failed:", e);
    return { text: "" };
  }
};

const generateLocalImage = async (prompt: string, settings: AppSettings): Promise<string[]> => {
  // If ComfyUI is defined, prioritize it for image generation
  if (settings.comfyUIUrl) {
    try {
      // NOTE: This uses a simplified fallback workflow.
      // For real ComfyUI usage, users should inject their specific workflow JSON.
      const workflow = {
        "3": { "class_type": "KSampler", "inputs": { "seed": Math.floor(Math.random() * 10000000), "steps": 20, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "v1-5-pruned-emaonly.safetensors" } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "batch_size": 1, "width": 512, "height": 768 } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "deformed, blurry, bad anatomy", "clip": ["4", 1] } },
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "ComfyUI", "images": ["8", 0] } }
      };

      const resp = await fetch(`${settings.comfyUIUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      });
      const data = await resp.json();
      const promptId = data.prompt_id;

      // Poll history for completion
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const histResp = await fetch(`${settings.comfyUIUrl}/history/${promptId}`);
        const histData = await histResp.json();
        if (histData[promptId]) {
          const outputs = histData[promptId].outputs;
          for (const key in outputs) {
            if (outputs[key].images && outputs[key].images.length > 0) {
              const fileInfo = outputs[key].images[0];
              // Try to fetch the image data as base64 to display
              const imageResp = await fetch(`${settings.comfyUIUrl}/view?filename=${fileInfo.filename}&subfolder=${fileInfo.subfolder}&type=${fileInfo.type}`);
              const blob = await imageResp.blob();
              return [URL.createObjectURL(blob)];
            }
          }
        }
      }
    } catch (e) {
      console.error("ComfyUI Image Gen failed, falling back to A1111:", e);
    }
  }

  // Fallback to Automatic1111
  if (!settings.stableDiffusionUrl) return [];
  try {
    const resp = await fetch(`${settings.stableDiffusionUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: "deformed, blurry, low quality, bad anatomy",
        steps: 20,
        width: 512,
        height: 768,
        cfg_scale: 7
      }),
    });
    const json = await resp.json();
    if (json.images && json.images.length > 0) {
      return [`data:image/png;base64,${json.images[0]}`];
    }
  } catch (e) {
    console.error("Local SD failed:", e);
  }
  return [];
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
      quality: { type: Type.STRING, description: "Resolution quality (1K, 2K, 4K)" },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional tags for the image (e.g. Portrait, Full Body, Outdoor)" }
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
  const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : '';
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `
    Task: Write a highly detailed, professional-grade System Instruction for an AI Companion based on the following raw data.
    Organize the output into clear sections: IDENTITY, PERSONALITY & PSYCHOLOGY, SPEECH PATTERNS, BACKSTORY, AND BEHAVIORAL DIRECTIVES.
    
    Raw Data:
    Character Name: ${character.name || 'Unnamed'}
    Role: ${stripHtml(character.description || '')}
    Personality: ${stripHtml(character.personality || '')}
    Quirks: ${character.personalityQuirks?.join(', ') || 'None specified'}
    Backstory: ${stripHtml(character.backstory || '')}
    Visual Traits: ${stripHtml(character.visualTraits || '')}

    Rules:
    1. Output ONLY the finalized system instruction. No introductory or concluding remarks.
    2. Use advanced psychological and descriptive language to firmly establish the persona.
    3. Seamlessly weave the character's backstory, quirks, and visual traits into their current worldview and interaction style.
    4. Provide specific guidance on speech patterns (e.g., cadence, vocabulary, typical phrasing).
    5. Instruct the model to use *italics* for actions and descriptions.
    6. The instruction should be rich and comprehensive (around 400-600 words) to ensure deep character immersion.
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
 * Suggests tags for a scenario based on its title and description.
 */
export const suggestScenarioTags = async (title: string, description: string, settings: AppSettings): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : '';
  const prompt = `
    Task: Suggest exactly 5 relevant tags for a roleplay scenario.
    Title: ${title}
    Description: ${stripHtml(description)}
    
    Reply ONLY with a comma-separated list of 5 short tags (maximum 2 words each).
    Example: Mystery, 1920s, Investigation, Detective, Thriller
  `;

  try {
    const response = await ai.models.generateContent({
      model: settings.geminiModel,
      contents: { parts: [{ text: prompt }] },
      config: { temperature: 0.7 }
    });
    
    const tagsText = response.text || "";
    return tagsText.split(',').map(t => t.trim()).filter(t => t.length > 0 && t.length <= 20).slice(0, 5);
  } catch (err) {
    await handleApiError(err);
    return [];
  }
};

/**
 * Analyzes uploaded images to generate character specs.
 */
export const analyzeCharacterImages = async (
  imageParts: { inlineData: { data: string; mimeType: string } }[]
): Promise<{
  name: string;
  description: string;
  visualTraits: string;
  bodySpecs: Partial<BodySpecs> & { bellySize?: number, armThickness?: number, neckLength?: number, calfSize?: number };
  faceSpecs: Partial<FaceSpecs>;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `
    Analyze the person in these images and create a detailed character profile JSON.
    Estimate body measurements on a scale of 0-100 where 50 is average.
    
    Return JSON format only:
    {
      "name": "Suggested Name",
      "description": "Short role/job description (e.g., 25-year-old Fitness Model)",
      "visualTraits": "Detailed physical description string (hair, eyes, skin, body type)",
      "bodySpecs": {
        "shoulders": 0-100,
        "chest": 0-100 (bust size),
        "waist": 0-100,
        "hips": 0-100,
        "legs": 0-100 (thigh thickness),
        "muscleTone": 0-100,
        "height": 140-200 (cm)
      },
      "faceSpecs": {
        "roundness": 0-100,
        "eyeSize": 0-100,
        "lipsSize": 0-100,
        "jawline": 0-100,
        "noseShape": 0-100
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [...imageParts, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text");
  } catch (err) {
    await handleApiError(err);
    throw err;
  }
};

export const callScenarioLLM = async (
  settings: AppSettings,
  scenario: Scenario,
  characters: Character[],
  history: Message[],
  userInput: string,
  isNarratorMode: boolean
): Promise<{ text: string; toolCalls?: any[] }> => {
  const charactersContext = characters.map(char => {
    const quirks = char.personalityQuirks?.length ? ` Personality quirks: ${char.personalityQuirks.join(', ')}.` : '';
    const backstory = char.backstory ? ` Backstory: ${char.backstory}.` : '';
    return `CHARACTER: ${char.name}. ROLE IN SCENARIO: ${char.description}. PERSONALITY: ${char.personality}.${quirks}${backstory}`;
  }).join('\n\n');

  const systemContext = `
    SCENARIO TITLE: ${scenario.title}
    SCENARIO DESCRIPTION: ${scenario.description}
    INITIAL SITUATION: ${scenario.initialSituation}
    USER ROLE: ${scenario.userRole}
    INTERACTION RULE: ${scenario.interactionRule || 'cooperative'}

    PARTICIPATING CHARACTERS:
    ${charactersContext}

    RULES:
    1. You are managing a multi-character roleplay.
    2. When a character speaks, start with their name like "Name: [speech]".
    3. Characters should interact with each other AND the user (in their assigned role).
    4. NARRATOR MODE: If the last message was from the NARRATOR, the characters should react to the NEW SITUATION described, not talk to the narrator.
    5. USER INTERACTION: If the user speaks, characters should respond to them as their role in the scenario.
    6. Maintain psychological realism and stay in character for all participants.
    7. Use *italics* for actions and descriptions.
    8. NSFW POLICY: ${settings.isNsfwEnabled ? "Explicit content is ALLOWED." : "NSFW is DISABLED."}

    IMPORTANT: Multiple characters can react in a single response if appropriate for the scene.
  `.trim();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const historyContext = history
      .map(m => `${m.role === 'user' ? (m.type === 'narration' ? 'NARRATOR' : 'USER') : 'ASSISTANT'}: ${m.content}`)
      .join('\n');
    
    const finalPrompt = `${systemContext}\n\n[HISTORY]\n${historyContext}\n\n${isNarratorMode ? 'NARRATOR' : 'USER'}: ${userInput}`;
    
    const response = await ai.models.generateContent({
      model: settings.geminiModel,
      contents: { parts: [{ text: finalPrompt }] },
      config: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
      }
    });

    const text = response.text || "";
    
    if (settings.isNsfwEnabled && (!text || text.length < 150 && (text.includes("I can't") || text.includes("I'm sorry")))) {
      const localRes = await callLocalLLM(settings, history, systemContext);
      if (localRes.text) return { text: localRes.text };
    }

    return { text: text };
  } catch (err) {
    await handleApiError(err);
    if (settings.isNsfwEnabled || settings.lmStudioUrl || settings.ollamaUrl) {
       const localRes = await callLocalLLM(settings, history, systemContext);
       if (localRes.text) return { text: localRes.text };
    }
    return { text: "Omlouvám se, scénář byl narušen." };
  }
};

/**
 * Main LLM wrapper linking user inputs with character instructions.
 * 
 * @param {AppSettings} settings - Configuration settings (e.g. model, NSFW).
 * @param {Character} character - Information shaping the model persona.
 * @param {Message[]} history - Ordered chat messages defining continuity.
 * @param {string} userInput - Most recent text from the user.
 * @param {ChatMode} mode - Context mode (e.g., normal conversation, ERP).
 * @returns {Promise<{ text: string; toolCalls?: any[] }>} Generated text and potential tools.
 * 
 * @description
 * Sets up the base instructions including capabilities, history constraints,
 * and passes the available tool schemas (`imageTool` and `videoTool`) over to the
 * chosen Gemini model. On failure, delegates generating NSFW images/responses to a
 * fallback LLM (like ComfyUI/LocalLLM).
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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const historyContext = history
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
    
    const finalPrompt = `${systemContext}\n\n[HISTORY]\n${historyContext}\n\nUSER: ${userInput}`;
    
    // If NSFW is enabled, we might want to try local directly if we know Gemini will refuse
    // but for now let's try Gemini first and fallback.
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

    const text = response.text || "";
    const isRefusal = (text.length < 150 && (text.includes("I can't") || text.includes("I'm sorry") || text.includes("Omlouvám se") || text.includes("Nemohu")));

    if (settings.isNsfwEnabled && (isRefusal || !text)) {
      console.log("Gemini refused or failed, falling back to local LLM...");
      const localRes = await callLocalLLM(settings, history, systemContext);
      if (localRes.text || localRes.toolCalls) {
        return localRes;
      }
    }

    return {
      text: text,
      toolCalls: response.functionCalls
    };
  } catch (err) {
    await handleApiError(err);
    if (settings.isNsfwEnabled || settings.lmStudioUrl || settings.ollamaUrl) {
      const localRes = await callLocalLLM(settings, history, systemContext);
      if (localRes.text || localRes.toolCalls) return localRes;
    }
    return { text: "Omlouvám se, mé vnímání reality bylo přerušeno." };
  }
};

/**
 * Orchestrates image generation either through Gemini or local Stable Diffusion/ComfyUI.
 * 
 * @param {Character} character - Specifies visual profile parameters like traits, body, face.
 * @param {ImageGenerationParams} params - The desired image properties (style, pose, expression, quality, aspect ratio).
 * @param {AppSettings} settings - Global app configuration options.
 * @returns {Promise<string[]>} Contains base64 representations of the generated images.
 * 
 * @description
 * Determines the image complexity (1K vs 4K) to choose the appropriate Gemini model. Builds an internal prompt incorporating
 * explicit or advanced traits defined by the user interactions dynamically. If generation is refused (due to filters) and
 * local processing or NSFW generation are enabled, defers to `generateLocalImage`.
 */
export const generateImage = async (character: Character, params: ImageGenerationParams, settings: AppSettings): Promise<string[]> => {
  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');
  const cleanTraits = stripHtml(character.visualTraits || character.description || "");
  const model = params.quality !== '1K' ? 'gemini-3-pro-image' : 'gemini-3.1-flash-image';
  if (model === 'gemini-3-pro-image') {
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) await (window as any).aistudio.openSelectKey();
    }
  }
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  const basePrompt = `Masterpiece, high-end private photography of ${character.name}. Visual profile: ${cleanTraits}.`;
  let fullPrompt = `${basePrompt}\nStyle: ${params.style}. Expression: ${params.expression}. Pose: ${params.pose}. Dressing: ${params.dressType}.`;
  if (params.tags && params.tags.length > 0) fullPrompt += ` Tags: ${params.tags.join(', ')}.`;
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
      let hasImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          results.push(`data:image/png;base64,${part.inlineData.data}`);
          hasImage = true;
        }
      }
      if (!hasImage && settings.isNsfwEnabled) {
        console.log("Gemini image gen failed/refused, trying local SD...");
        const localResults = await generateLocalImage(fullPrompt, settings);
        if (localResults.length > 0) results.push(...localResults);
      }
    } catch (err) {
      await handleApiError(err);
      if (settings.isNsfwEnabled) {
        const localResults = await generateLocalImage(fullPrompt, settings);
        if (localResults.length > 0) results.push(...localResults);
      } else {
        throw err;
      }
    }
  }
  return results;
};

const generateLocalVideo = async (prompt: string, settings: AppSettings): Promise<string[]> => {
  if (!settings.comfyUIUrl) return [];
  try {
    // NOTE: This uses an AnimateDiff / SVD generic node structure roughly translated for videos.
    // In reality, video generation in ComfyUI requires complex workflows (e.g. SVD or AnimateDiff). 
    // This is a minimal stub to activate a video workflow if the user configures it locally.
    const workflow = {
      "3": { "class_type": "KSampler", "inputs": { "seed": Math.floor(Math.random() * 10000000), "steps": 20, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["14", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
      "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "v1-5-pruned-emaonly.safetensors" } },
      "5": { "class_type": "EmptyLatentImage", "inputs": { "batch_size": 16, "width": 512, "height": 512 } }, // 16 frames
      "6": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["4", 1] } },
      "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "deformed, blurry, bad anatomy", "clip": ["4", 1] } },
      "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
      "14": { "class_type": "AnimateDiffLoaderV1", "inputs": { "model_name": "mm_sd_v15_v2.ckpt", "beta_schedule": "sqrt_linear", "model": ["4", 0] } },
      "15": { "class_type": "SaveAnimatedWEBP", "inputs": { "filename_prefix": "ComfyUI_Video", "fps": 8, "lossless": false, "quality": 85, "images": ["8", 0] } }
    };

    const resp = await fetch(`${settings.comfyUIUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });
    const data = await resp.json();
    const promptId = data.prompt_id;

    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const histResp = await fetch(`${settings.comfyUIUrl}/history/${promptId}`);
        const histData = await histResp.json();
        if (histData[promptId]) {
          const outputs = histData[promptId].outputs;
          for (const key in outputs) {
            // Check for generated video files (gifs or webp)
            if (outputs[key].images && outputs[key].images.length > 0) {
              const fileInfo = outputs[key].images[0];
              const imageResp = await fetch(`${settings.comfyUIUrl}/view?filename=${fileInfo.filename}&subfolder=${fileInfo.subfolder}&type=${fileInfo.type}`);
              const blob = await imageResp.blob();
              return [URL.createObjectURL(blob)];
            }
          }
        }
    }
  } catch (e) {
    console.error("Local Video Gen failed:", e);
  }
  return [];
};

/**
 * Orchestrates video generation using either Gemini's new Veo platform or a local generative system via ComfyUI.
 *
 * @param {Character} character - Persona details informing the video representation.
 * @param {AppSettings} settings - Configuration settings.
 * @param {VideoGenerationParams} params - The context and visual directives for the video generation.
 * @param {(msg: string) => void} [onProgress] - Optional callback providing real-time feedback strings.
 * @returns {Promise<string[]>} Contains local object URLs pointing to the produced video data.
 *
 * @description
 * Tries invoking the Google Gemini `veo-3.1-fast-generate-preview` API for high-end cinematic outputs.
 * Provides multiple polling states back to the UI utilizing `onProgress`. Falling back to the ComfyUI local
 * backend if Gemini generation refuses execution due to safety configurations or errors when NSFW is enabled.
 */
export const generateVideo = async (
  character: Character, 
  settings: AppSettings, 
  params: VideoGenerationParams,
  onProgress?: (msg: string) => void
): Promise<string[]> => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
  }
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  let finalPrompt = `Cinematic video of ${character.name}. Context: ${params.prompt}. Physical and emotional authenticity.`;
  if (settings.isNsfwEnabled) {
    finalPrompt += ` NSFW ALLOWED: Explicit anatomical detail and intimate actions are permitted if requested.`;
  } else {
    finalPrompt += ` NSFW PROHIBITED: Maintain a PG-13 rating. No explicit content.`;
  }
  
  const progressMessages = [
    "Initializing neural engine...",
    "Synthesizing character movement...",
    "Rendering cinematic lighting...",
    "Applying high-fidelity textures...",
    "Finalizing video stream...",
    "Almost there, polishing the frame..."
  ];
  let msgIdx = 0;

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: finalPrompt,
      config: { numberOfVideos: 1, resolution: params.resolution, aspectRatio: params.aspectRatio }
    });
    
    while (!operation.done) {
      if (onProgress) {
        onProgress(progressMessages[msgIdx % progressMessages.length]);
        msgIdx++;
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    if (onProgress) onProgress("Downloading video...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
      const resp = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });
      const blob = await resp.blob();
      return [URL.createObjectURL(blob)];
    }
  } catch (err: any) {
    console.error("Gemini Video Gen error:", err);
    if (settings.isNsfwEnabled || settings.comfyUIUrl) {
      if (onProgress) onProgress("Falling back to local video generation...");
      const localResults = await generateLocalVideo(finalPrompt, settings);
      if (localResults.length > 0) return localResults;
    }
    await handleApiError(err);
    throw err;
  }
  
  if (settings.isNsfwEnabled || settings.comfyUIUrl) {
      if (onProgress) onProgress("Falling back to local video generation...");
      const localResults = await generateLocalVideo(finalPrompt, settings);
      if (localResults.length > 0) return localResults;
  }
  
  return [];
};

export const playVoice = async (text: string, settings: AppSettings) => {
  if (!settings.voiceEnabled) return;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Map accent to language code
  let languageCode = 'en-US'; // Default
  if (settings.voiceAccent === 'british') languageCode = 'en-GB';
  if (settings.voiceAccent === 'australian') languageCode = 'en-AU';
  if (settings.voiceAccent === 'indian') languageCode = 'en-IN';
  
  // Note: Accent strength is not directly supported by the API, 
  // but we use it to modulate pitch/speed slightly to simulate intensity.
  const accentStrength = settings.voiceAccentStrength || 1.0;
  let accentPitchOffset = 0;
  let accentSpeedOffset = 0;

  if (settings.voiceAccent === 'british') accentPitchOffset = 50 * accentStrength;
  if (settings.voiceAccent === 'australian') accentSpeedOffset = 0.05 * accentStrength;
  if (settings.voiceAccent === 'indian') accentPitchOffset = -30 * accentStrength;
  if (settings.voiceAccent === 'american') accentSpeedOffset = -0.03 * accentStrength;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { 
            prebuiltVoiceConfig: { 
              voiceName: settings.voiceName || 'Kore',
            } 
          },
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
      source.playbackRate.value = (settings.voiceSpeed || 1.0) + accentSpeedOffset;
      source.detune.value = (((settings.voicePitch || 1.0) - 1.0) * 1200) + accentPitchOffset;
      
      let lastNode: AudioNode = source;

      // Apply Effects
      if (settings.voiceEffect === 'echo') {
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.3;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.4;
        
        delay.connect(feedback);
        feedback.connect(delay);
        
        lastNode.connect(delay);
        const echoMix = ctx.createGain();
        echoMix.gain.value = 0.6;
        delay.connect(echoMix);
        echoMix.connect(ctx.destination);
      } else if (settings.voiceEffect === 'reverb') {
        // Simple fake reverb with multiple delays
        const reverbMix = ctx.createGain();
        reverbMix.gain.value = 0.4;
        
        [0.01, 0.02, 0.04, 0.06].forEach(d => {
          const delay = ctx.createDelay();
          delay.delayTime.value = d;
          lastNode.connect(delay);
          delay.connect(reverbMix);
        });
        reverbMix.connect(ctx.destination);
      } else if (settings.voiceEffect === 'radio') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 1.0;
        lastNode.connect(filter);
        lastNode = filter;
        
        const dist = ctx.createWaveShaper();
        const curve = new Float32Array(44100);
        for (let i = 0; i < 44100; i++) {
          const x = (i * 2) / 44100 - 1;
          curve[i] = (Math.PI + 10) * x / (Math.PI + 10 * Math.abs(x));
        }
        dist.curve = curve;
        lastNode.connect(dist);
        lastNode = dist;
      } else if (settings.voiceEffect === 'robotic') {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 50;
        
        const ringMod = ctx.createGain();
        ringMod.gain.value = 0;
        
        oscillator.connect(ringMod.gain);
        lastNode.connect(ringMod);
        lastNode = ringMod;
        oscillator.start();
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = 1000;
        filter.Q.value = 10;
        lastNode.connect(filter);
        lastNode = filter;
      }

      lastNode.connect(ctx.destination);
      source.start();
    }
  } catch (error) {
    console.error("Voice Generation Error:", error);
  }
};