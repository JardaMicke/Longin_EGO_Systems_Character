const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

// Insert import at the top
if (!code.includes("import { SDXL_TEXT_TO_IMAGE }")) {
  code = "import { SDXL_TEXT_TO_IMAGE } from './workflows/text_to_image_sdxl';\n" + code;
}

const wsClientCode = `async function runComfyUIWorkflow(workflow: any, serverUrl: string): Promise<string[]> {
  const clientId = Math.random().toString(36).substring(2, 15);
  const url = serverUrl.replace(/\\/$/, '');
  const wsUrl = url.replace(/^http/, 'ws') + \`/ws?clientId=\${clientId}\`;
  
  return new Promise((resolve, reject) => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      return reject(e);
    }
    
    let currentPromptId = '';

    ws.onopen = async () => {
      try {
        const resp = await fetch(\`\${url}/prompt\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: workflow, client_id: clientId }),
        });
        if (!resp.ok) {
          ws.close();
          return reject(new Error(\`ComfyUI prompt error: \${resp.statusText}\`));
        }
        const data = await resp.json();
        currentPromptId = data.prompt_id;
      } catch (e) {
        ws.close();
        reject(e);
      }
    };
    
    ws.onmessage = async (event) => {
      try {
        if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'executing' && msg.data.node === null && msg.data.prompt_id === currentPromptId) {
            // Execution is done, fetch history
            const histResp = await fetch(\`\${url}/history/\${currentPromptId}\`);
            const histData = await histResp.json();
            const outputs = histData[currentPromptId]?.outputs;
            if (outputs) {
              for (const key in outputs) {
                if (outputs[key].images && outputs[key].images.length > 0) {
                  const fileInfo = outputs[key].images[0];
                  const imageResp = await fetch(\`\${url}/view?filename=\${fileInfo.filename}&subfolder=\${fileInfo.subfolder}&type=\${fileInfo.type}\`);
                  const blob = await imageResp.blob();
                  const reader = new FileReader();
                  reader.onloadend = () => {
                     resolve([reader.result as string]);
                     ws.close();
                  };
                  reader.readAsDataURL(blob);
                  return;
                }
              }
            }
            resolve([]);
            ws.close();
          }
        }
      } catch (e) {
        console.error('Error parsing ComfyUI WS message:', e);
      }
    };
    
    ws.onerror = (e) => {
      reject(e);
    };
    
    ws.onclose = () => {
      // In case it closed before resolving
    };
  });
}
`;

// Insert wsClientCode before generateLocalImage
if (!code.includes("async function runComfyUIWorkflow")) {
  code = code.replace("const generateLocalImage =", wsClientCode + "\nconst generateLocalImage =");
}

const originalComfyBlock = `  if (settings.comfyUIUrl) {
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

      const resp = await fetch(\`\${settings.comfyUIUrl}/prompt\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      });
      const data = await resp.json();
      const promptId = data.prompt_id;

      // Poll history for completion
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const histResp = await fetch(\`\${settings.comfyUIUrl}/history/\${promptId}\`);
        const histData = await histResp.json();
        if (histData[promptId]) {
          const outputs = histData[promptId].outputs;
          for (const key in outputs) {
            if (outputs[key].images && outputs[key].images.length > 0) {
              const fileInfo = outputs[key].images[0];
              // Try to fetch the image data as base64 to display
              const imageResp = await fetch(\`\${settings.comfyUIUrl}/view?filename=\${fileInfo.filename}&subfolder=\${fileInfo.subfolder}&type=\${fileInfo.type}\`);
              const blob = await imageResp.blob();
              return [URL.createObjectURL(blob)];
            }
          }
        }
      }
    } catch (e) {
      console.error("ComfyUI Image Gen failed, falling back to A1111:", e);
    }
  }`;

const newComfyBlock = `  if (settings.comfyUIUrl) {
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

if (code.includes("const workflow = {")) {
  code = code.replace(originalComfyBlock, newComfyBlock);
}

fs.writeFileSync('llmService.ts', code);
console.log('Patched llmService.ts successfully.');
