const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

// 1. In generateImage, inject photorealisticBoost
const promptInjection = `
  let fullPrompt = \`\${basePrompt}\\nStyle: \${params.style}. Expression: \${params.expression}. Pose: \${params.pose}. Dressing: \${params.dressType}.\`;
  if (params.photorealisticBoost) {
    fullPrompt += " RAW photo, 8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT4, highly detailed, professional photography, masterpiece, sharp focus.";
  }
`;

if (code.includes("let fullPrompt = `${basePrompt}\\nStyle: ${params.style}. Expression: ${params.expression}. Pose: ${params.pose}. Dressing: ${params.dressType}.`;")) {
  code = code.replace(
    "let fullPrompt = `${basePrompt}\\nStyle: ${params.style}. Expression: ${params.expression}. Pose: ${params.pose}. Dressing: ${params.dressType}.`;",
    promptInjection
  );
  console.log("llmService.ts photorealism prompt patched");
}

// 2. In generateLocalImage, enforce IPAdapter if useConsistentCharacter is true, even if referenceImage is provided (or just ensure it uses IPAdapter)
// We need to pass `params.useConsistentCharacter` down to `generateLocalImage`.
// Wait, generateLocalImage takes: `(prompt: string, settings: AppSettings, character?: Character, referenceImage?: string, denoise: number = 1.0)`
// I can add `useConsistentCharacter?: boolean` as an argument.
