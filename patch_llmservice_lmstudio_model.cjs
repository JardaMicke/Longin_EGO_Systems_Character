const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const originalModelLine = "model: settings.isNsfwEnabled ? settings.nsfwModel : (isLmStudio ? settings.openaiModel : settings.ollamaModel),";
const newModelLine = "model: settings.isNsfwEnabled ? settings.nsfwModel : (isLmStudio ? settings.lmStudioModel : settings.ollamaModel),";

if (code.includes(originalModelLine)) {
  code = code.replace(originalModelLine, newModelLine);
  fs.writeFileSync('llmService.ts', code);
  console.log("Patched llmService.ts with lmStudioModel");
} else {
  console.log("Could not find the original model line to patch.");
}
