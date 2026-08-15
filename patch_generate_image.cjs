const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

if (code.includes("const generateLocalImage = async (prompt: string, settings: AppSettings, character?: Character, referenceImage?: string, denoise: number = 1.0): Promise<string[]> => {")) {
  code = code.replace(
    "const generateLocalImage = async (prompt: string, settings: AppSettings, character?: Character, referenceImage?: string, denoise: number = 1.0): Promise<string[]> => {",
    "const generateLocalImage = async (prompt: string, settings: AppSettings, character?: Character, referenceImage?: string, denoise: number = 1.0, enforceConsistency?: boolean): Promise<string[]> => {"
  );
  
  // Replace the conditional for workflow:
  const oldConditional = "if (referenceImage) {";
  const newConditional = "if (enforceConsistency && character && character.avatar && character.profile?.gallery?.[0]) {\n        console.log(\"Forced Consistent Character IPAdapter workflow...\");\n        workflow = JSON.parse(JSON.stringify(SDXL_CONSISTENT_CHARACTER));\n        const faceRefName = await uploadImageToComfyUI(character.avatar, settings.comfyUIUrl, `face_${character.id}.png`);\n        const bodyRefName = await uploadImageToComfyUI(character.profile.gallery[0], settings.comfyUIUrl, `body_${character.id}.png`);\n        workflow[\"6\"].inputs.text = prompt;\n        workflow[\"3\"].inputs.seed = Math.floor(Math.random() * 1000000000);\n        workflow[\"10\"].inputs.image = faceRefName;\n        workflow[\"11\"].inputs.image = bodyRefName;\n      } else if (referenceImage) {";
  
  code = code.replace(oldConditional, newConditional);
  
  // Now patch the calls to generateLocalImage inside generateImage
  code = code.replace(
    /const localResults = await generateLocalImage\(fullPrompt, settings, character, params.referenceImage, params.denoise\);/g,
    "const localResults = await generateLocalImage(fullPrompt, settings, character, params.referenceImage, params.denoise, params.useConsistentCharacter);"
  );
  
  fs.writeFileSync('llmService.ts', code);
  console.log("llmService.ts generateLocalImage patched");
}
