const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const originalScenarioContext = "const finalPrompt = `${systemContext}\\n\\n[HISTORY]\\n${historyContext}\\n\\n${isNarratorMode ? 'NARRATOR' : 'USER'}: ${userInput}`;";

const updatedScenarioContext = `
    const ragContext = await searchRagContext(userInput, scenario.id);
    const finalPrompt = \`\${systemContext}\\n\\n\${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}[HISTORY]\\n\${historyContext}\\n\\n\${isNarratorMode ? 'NARRATOR' : 'USER'}: \${userInput}\`;
`;

if (code.includes(originalScenarioContext)) {
  code = code.replace(originalScenarioContext, updatedScenarioContext);
  fs.writeFileSync('llmService.ts', code);
  console.log("llmService.ts scenario patched for RAG");
} else {
  console.log("Could not find scenario context line in llmService.ts");
}
