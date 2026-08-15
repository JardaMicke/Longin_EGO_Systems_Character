const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const knowledgeBaseContext = `
  let knowledgeBaseContext = '';
  if (character.contextMedia && character.contextMedia.length > 0) {
    const textContexts = character.contextMedia.filter(m => m.type === 'text');
    if (textContexts.length > 0) {
      knowledgeBaseContext = '\\n\\nKNOWLEDGE BASE & CONTEXT FILES:\\n' + textContexts.map(t => \`File: \${t.name || 'document'}\\n\${atob(t.data)}\`).join('\\n\\n');
    }
  }
`;

code = code.replace(
  "const quirks = character.personalityQuirks?.length ?",
  knowledgeBaseContext + "\n  const quirks = character.personalityQuirks?.length ?"
);

code = code.replace(
  "PERSONALITY: ${character.personality}.${quirks}${backstory}${memoryContext}",
  "PERSONALITY: ${character.personality}.${quirks}${backstory}${memoryContext}${knowledgeBaseContext}"
);

fs.writeFileSync('llmService.ts', code);
console.log("llmService.ts patched");
