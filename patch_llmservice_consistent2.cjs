const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const originalLocalImageSig = `const generateLocalImage = async (prompt: string, settings: AppSettings): Promise<string[]> => {`;
const newLocalImageSig = `const generateLocalImage = async (prompt: string, settings: AppSettings, character?: Character): Promise<string[]> => {`;
code = code.replace(originalLocalImageSig, newLocalImageSig);

const originalComfyBlock = `  if (settings.comfyUIUrl) {
    try {
      // 1) Prepare the SDXL Text-to-Image Workflow
      const workflow = JSON.parse(JSON.stringify(SDXL_TEXT_TO_IMAGE));
      // 2) Inject prompt
      workflow["6"].inputs.text = prompt; // Node 6 is Positive Prompt
      workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000000); // Random Seed
      
      console.log("Starting ComfyUI WS workflow...");
      const images = await runComfyUIWorkflow(workflow, settings.comfyUIUrl);
      if (images && images.length > 0) return images;
    } catch (e) {
      console.error("ComfyUI WS Image Gen failed, falling back to A1111:", e);
    }
  }`;

const newComfyBlock = `  if (settings.comfyUIUrl) {
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

if (code.includes(originalComfyBlock)) {
  code = code.replace(originalComfyBlock, newComfyBlock);
}

// Update calls to generateLocalImage
code = code.replace(/generateLocalImage\(fullPrompt, settings\)/g, "generateLocalImage(fullPrompt, settings, character)");

fs.writeFileSync('llmService.ts', code);
console.log('Patched consistent generation logic successfully.');
