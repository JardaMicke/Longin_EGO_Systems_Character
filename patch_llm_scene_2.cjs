const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

// The actual signature is:
// export const callScenarioLLM = async (
//   settings: AppSettings,
//   scenario: Scenario,
//   characters: Character[],
//   history: Message[],
//   userInput: string,
//   isNarratorMode: boolean = false
// ): Promise<{ text: string; toolCalls?: any[] }> => {

const oldSig = "export const callScenarioLLM = async (\\n  settings: AppSettings,\\n  scenario: Scenario,\\n  characters: Character[],";
const newSig = "export const callScenarioLLM = async (\\n  settings: AppSettings,\\n  scenario: Scenario,\\n  currentNodeData: any,\\n  characters: Character[],";

if (code.includes("export const callScenarioLLM = async (\n  settings: AppSettings,\n  scenario: Scenario,\n  characters: Character[],")) {
  code = code.replace(
    "export const callScenarioLLM = async (\n  settings: AppSettings,\n  scenario: Scenario,\n  characters: Character[],", 
    "export const callScenarioLLM = async (\n  settings: AppSettings,\n  scenario: Scenario,\n  currentNodeData: any,\n  characters: Character[],"
  );
  fs.writeFileSync('llmService.ts', code);
  console.log("llmService.ts signature patched");
} else {
  console.log("Could not find callScenarioLLM signature");
}
