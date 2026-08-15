const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

// Update signature
const oldSig = "export const callScenarioLLM = async (\\n  scenario: Scenario,";
const newSig = "export const callScenarioLLM = async (\\n  scenario: Scenario,\\n  currentNodeData: any,";
if (code.includes("export const callScenarioLLM = async (\n  scenario: Scenario,")) {
    code = code.replace("export const callScenarioLLM = async (\n  scenario: Scenario,", newSig);
}

// Inject Node Constraint
const oldSysContext = "const finalPrompt = `\\${systemContext}\\n\\n\\${ragContext";
const sceneConstraint = `
    let sceneConstraint = '';
    if (currentNodeData) {
      sceneConstraint = \`[CURRENT SCENE CONSTRAINT]\\nYou are currently in the following state/scene. You must strictly adhere to these instructions and current events:\\nScene Title: \${currentNodeData.label || 'Unknown'}\\nInstructions: \${currentNodeData.content || 'N/A'}\\n\\n\`;
    }
    const finalPrompt = \`\${systemContext}\\n\\n\${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}\${sceneConstraint}[HISTORY]\\n\${historyContext}\\n\\n\${isNarratorMode ? 'NARRATOR' : 'USER'}: \${userInput}\`;
`;

if (code.includes("const finalPrompt = `${systemContext}\\n\\n${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}[HISTORY]\\n${historyContext}\\n\\n${isNarratorMode ? 'NARRATOR' : 'USER'}: ${userInput}`;")) {
  code = code.replace(
    "const finalPrompt = `${systemContext}\\n\\n${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}[HISTORY]\\n${historyContext}\\n\\n${isNarratorMode ? 'NARRATOR' : 'USER'}: ${userInput}`;",
    sceneConstraint
  );
  fs.writeFileSync('llmService.ts', code);
  console.log("llmService.ts patched for Scene constraints");
} else {
  console.log("Could not find the prompt compilation string in llmService.ts");
}
