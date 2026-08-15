const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const videoPromptInjection = `
  let finalPrompt = \`Cinematic video of \${character.name}. Context: \${params.prompt}. Physical and emotional authenticity.\`;
  if (params.photorealisticBoost) {
    finalPrompt += " RAW photo style, 8k uhd, soft volumetric lighting, high quality film grain, Fujifilm XT4 lens, highly detailed, photorealistic motion, professional cinematography, sharp focus.";
  }
`;

if (code.includes("let finalPrompt = `Cinematic video of ${character.name}. Context: ${params.prompt}. Physical and emotional authenticity.`;")) {
  code = code.replace(
    "let finalPrompt = `Cinematic video of ${character.name}. Context: ${params.prompt}. Physical and emotional authenticity.`;",
    videoPromptInjection
  );
  fs.writeFileSync('llmService.ts', code);
  console.log("llmService.ts video prompt patched");
}
