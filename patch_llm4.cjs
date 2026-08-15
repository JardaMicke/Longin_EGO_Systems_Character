const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

code = code.replace(
  "    const finalPrompt = \`\${systemContext}\\n\\n\${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}\${sceneConstraint}[HISTORY]\\n\${historyContext}\\n\\n\${isNarratorMode ? 'NARRATOR' : 'USER'}: \${userInput}\`;",
  "    const finalPrompt = \`\${systemContext}\\n\\n\${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}\${sceneConstraint}[HISTORY]\\n\${historyContext}\\n\\n\${isNarratorMode ? 'NARRATOR' : 'USER'}: \${userInput}\`;\n    const requestParts = [{ text: finalPrompt }];"
);

fs.writeFileSync('llmService.ts', code);
console.log("llmService.ts scenario fix patched");
