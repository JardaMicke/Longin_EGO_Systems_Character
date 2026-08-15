const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

if (!code.includes("import { ANIMATEDIFF_WORKFLOW }")) {
  code = "import { ANIMATEDIFF_WORKFLOW } from './workflows/video_animatediff';\n" + code;
}

const originalVideoGen = `const generateLocalVideo = async (prompt: string, settings: AppSettings): Promise<string[]> => {
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

    const resp = await fetch(\`\${settings.comfyUIUrl}/prompt\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });
    const data = await resp.json();
    const promptId = data.prompt_id;

    // Poll history for completion
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const histResp = await fetch(\`\${settings.comfyUIUrl}/history/\${promptId}\`);
      const histData = await histResp.json();
      if (histData[promptId]) {
        const outputs = histData[promptId].outputs;
        for (const key in outputs) {
          if (outputs[key].images && outputs[key].images.length > 0) {
            const fileInfo = outputs[key].images[0];
            const imageResp = await fetch(\`\${settings.comfyUIUrl}/view?filename=\${fileInfo.filename}&subfolder=\${fileInfo.subfolder}&type=\${fileInfo.type}\`);
            const blob = await imageResp.blob();
            return [URL.createObjectURL(blob)];
          }
        }
      }
    }
  } catch (e) {
    console.error("ComfyUI Video Gen failed:", e);
  }
  return [];
};`;

const newVideoGen = `const generateLocalVideo = async (prompt: string, settings: AppSettings): Promise<string[]> => {
  if (!settings.comfyUIUrl) return [];
  try {
    const workflow = JSON.parse(JSON.stringify(ANIMATEDIFF_WORKFLOW));
    workflow["6"].inputs.text = prompt;
    workflow["3"].inputs.seed = Math.floor(Math.random() * 1000000000);
    
    console.log("Starting ComfyUI WS Video workflow (AnimateDiff)...");
    const videos = await runComfyUIWorkflow(workflow, settings.comfyUIUrl);
    if (videos && videos.length > 0) return videos;
  } catch (e) {
    console.error("ComfyUI Video Gen failed:", e);
  }
  return [];
};`;

if (code.includes('const generateLocalVideo')) {
  code = code.replace(originalVideoGen, newVideoGen);
  fs.writeFileSync('llmService.ts', code);
  console.log("Patched generateLocalVideo");
}
