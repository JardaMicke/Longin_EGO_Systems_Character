const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Find the callScenarioLLM call
const oldCall = "const result = await callScenarioLLM(settings, scenario, scenarioCharacters, updatedMessages.slice(-20), text, isNarratorMode);";
const newCall = `
      const currentNodeId = updatedSession.currentNodeId || (scenario.nodes && scenario.nodes.length > 0 ? scenario.nodes[0].id : undefined);
      const currentNodeData = scenario.nodes?.find(n => n.id === currentNodeId)?.data;
      const result = await callScenarioLLM(settings, scenario, currentNodeData, scenarioCharacters, updatedMessages.slice(-20), text, isNarratorMode);
`;

if (code.includes(oldCall)) {
  code = code.replace(oldCall, newCall);
  fs.writeFileSync('App.tsx', code);
  console.log("App.tsx LLM call patched");
} else {
  console.log("Could not find callScenarioLLM call in App.tsx");
}
