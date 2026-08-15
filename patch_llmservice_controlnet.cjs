const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

if (!code.includes("import { CONTROLNET_WORKFLOW }")) {
  code = "import { CONTROLNET_WORKFLOW } from './workflows/photo_to_image_controlnet';\n" + code;
}

const originalLocalImageSig = `const generateLocalImage = async (prompt: string, settings: AppSettings, character?: Character): Promise<string[]> => {`;
const newLocalImageSig = `const generateLocalImage = async (prompt: string, settings: AppSettings, character?: Character, referenceImage?: string, denoise: number = 1.0): Promise<string[]> => {`;
if (code.includes(originalLocalImageSig)) {
  code = code.replace(originalLocalImageSig, newLocalImageSig);
} else {
    console.log("LocalImage signature not found, might have already been patched.");
}

const originalComfyBlock = `  if (settings.comfyUIUrl) {
    try {
      let workflow;
      
      // If we have a character with an avatar and gallery, we use the Consistent Character workflow
      if (character && character.avatar && character.profile?.gallery?.[0]) {
        console.log("Using Consistent Character IPAdapter workflow...");
        workflow = JSON.parse(JSON.stringify(SDXL_CONSISTENT_CHARACTER));
        
        // Upload references to ComfyUI input folder
        const faceRefName = await uploadImageToComfyUI(character.avatar, settings.comfyUIUrl, \`face_\${character.id}.png\`);
        const bodyRefName = await uploadImageToComfyUI(character.profile.gallery[0], settings.comfyUIUrl, \`body_\${character.id}.png\`);
        
        // Inject dependencies
        workflow["6"].inputs.text = prompt;
        workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000000);
        workflow["10"].inputs.image = faceRefName;
        workflow["11"].inputs.image = bodyRefName;
        
      } else {
        console.log("Using Standard SDXL workflow...");
        workflow = JSON.parse(JSON.stringify(SDXL_TEXT_TO_IMAGE));
        workflow["6"].inputs.text = prompt;
        workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000000);
      }
      
      const images = await runComfyUIWorkflow(workflow, settings.comfyUIUrl);
      if (images && images.length > 0) return images;
    } catch (e) {
      console.error("ComfyUI WS Image Gen failed, falling back to A1111:", e);
    }
  }`;

const newComfyBlock = `  if (settings.comfyUIUrl) {
    try {
      let workflow;
      
      if (referenceImage) {
        console.log("Using ControlNet Photo-to-Image workflow...");
        workflow = JSON.parse(JSON.stringify(CONTROLNET_WORKFLOW));
        
        const refName = await uploadImageToComfyUI(referenceImage, settings.comfyUIUrl, \`ref_\${Date.now()}.png\`);
        
        workflow["6"].inputs.text = prompt;
        workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000000);
        workflow["3"].inputs.denoise = denoise;
        workflow["10"].inputs.image = refName;
      } else if (character && character.avatar && character.profile?.gallery?.[0]) {
        console.log("Using Consistent Character IPAdapter workflow...");
        workflow = JSON.parse(JSON.stringify(SDXL_CONSISTENT_CHARACTER));
        
        const faceRefName = await uploadImageToComfyUI(character.avatar, settings.comfyUIUrl, \`face_\${character.id}.png\`);
        const bodyRefName = await uploadImageToComfyUI(character.profile.gallery[0], settings.comfyUIUrl, \`body_\${character.id}.png\`);
        
        workflow["6"].inputs.text = prompt;
        workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000000);
        workflow["10"].inputs.image = faceRefName;
        workflow["11"].inputs.image = bodyRefName;
      } else {
        console.log("Using Standard SDXL workflow...");
        workflow = JSON.parse(JSON.stringify(SDXL_TEXT_TO_IMAGE));
        workflow["6"].inputs.text = prompt;
        workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000000);
      }
      
      const images = await runComfyUIWorkflow(workflow, settings.comfyUIUrl);
      if (images && images.length > 0) return images;
    } catch (e) {
      console.error("ComfyUI WS Image Gen failed, falling back to A1111:", e);
    }
  }`;

if (code.includes('Using Consistent Character IPAdapter workflow')) {
  code = code.replace(originalComfyBlock, newComfyBlock);
}

const originalCatchGen = `const localResults = await generateLocalImage(fullPrompt, settings, character);`;
const newCatchGen = `const localResults = await generateLocalImage(fullPrompt, settings, character, params.referenceImage, params.denoise);`;
code = code.replace(/const localResults = await generateLocalImage\(fullPrompt, settings, character\);/g, newCatchGen);

fs.writeFileSync('llmService.ts', code);
console.log('Patched llmService.ts with ControlNet integration.');
