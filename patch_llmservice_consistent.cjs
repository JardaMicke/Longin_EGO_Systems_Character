const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

// Insert import for the new workflow
if (!code.includes("import { SDXL_CONSISTENT_CHARACTER }")) {
  code = "import { SDXL_CONSISTENT_CHARACTER } from './workflows/consistent_character_sdxl';\n" + code;
}

// Add the upload helper function
const uploadHelperCode = `async function uploadImageToComfyUI(base64Data: string, serverUrl: string, filename: string): Promise<string> {
  const url = serverUrl.replace(/\\/$/, '');
  
  // Convert base64 to blob
  const base64Response = await fetch(base64Data);
  const blob = await base64Response.blob();
  
  const formData = new FormData();
  formData.append('image', blob, filename);
  
  const resp = await fetch(\`\${url}/upload/image\`, {
    method: 'POST',
    body: formData
  });
  
  if (!resp.ok) {
    throw new Error(\`Failed to upload image to ComfyUI: \${resp.statusText}\`);
  }
  
  const data = await resp.json();
  return data.name; // ComfyUI returns the saved filename
}
`;

if (!code.includes("async function uploadImageToComfyUI")) {
  code = code.replace("async function runComfyUIWorkflow", uploadHelperCode + "\nasync function runComfyUIWorkflow");
}

fs.writeFileSync('llmService.ts', code);
console.log('Patched upload helper successfully.');
