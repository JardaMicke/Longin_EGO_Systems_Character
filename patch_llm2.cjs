const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const betterDecode = `
  let knowledgeBaseContext = '';
  if (character.contextMedia && character.contextMedia.length > 0) {
    const textContexts = character.contextMedia.filter(m => m.type === 'text');
    if (textContexts.length > 0) {
      knowledgeBaseContext = '\\n\\nKNOWLEDGE BASE & CONTEXT FILES:\\n' + textContexts.map(t => {
        try {
          const decoded = decodeURIComponent(escape(atob(t.data)));
          return \`File: \${t.name || 'document'}\\n\${decoded}\`;
        } catch(e) {
          try {
            return \`File: \${t.name || 'document'}\\n\${atob(t.data)}\`;
          } catch(err) {
            return \`File: \${t.name || 'document'} (binary data)\`;
          }
        }
      }).join('\\n\\n');
    }
  }
`;

// Replace the previous naive atob block
code = code.replace(
  /let knowledgeBaseContext = '';[\s\S]*?\}\n  \}\n/m,
  betterDecode
);

fs.writeFileSync('llmService.ts', code);
console.log("llmService.ts patched with better decode");
