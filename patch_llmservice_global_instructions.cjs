const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

// For callScenarioLLM
const scenarioRulesMarker = '    RULES:';
code = code.replace(
  scenarioRulesMarker,
  '    GLOBAL INSTRUCTIONS:\n    ${settings.globalInstructions || "None"}\n\n    RULES:'
);

// For callLLM
const characterRulesMarker = '    CAPABILITIES:';
code = code.replace(
  characterRulesMarker,
  '    GLOBAL INSTRUCTIONS:\n    ${settings.globalInstructions || "None"}\n\n    CAPABILITIES:'
);

fs.writeFileSync('llmService.ts', code);
console.log("llmService.ts patched with global instructions");
