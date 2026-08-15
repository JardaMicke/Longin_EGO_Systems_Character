const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const imagePartsDef = `
    const imageParts: any[] = [];
    if (character.contextMedia) {
      const images = character.contextMedia.filter(m => m.type === 'image');
      for (const img of images) {
        if (img.data) {
          // If it starts with data:, slice it off
          let base64 = img.data;
          let mime = img.mimeType || 'image/jpeg';
          if (base64.startsWith('data:')) {
            const parts = base64.split(',');
            mime = parts[0].split(':')[1].split(';')[0];
            base64 = parts[1];
          }
          imageParts.push({ inlineData: { data: base64, mimeType: mime } });
        }
      }
    }
    
    const finalPrompt = \`\${systemContext}\\n\\n\${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}[HISTORY]\\n\${historyContext}\\n\\nUSER: \${userInput}\`;
    const requestParts = [...imageParts, { text: finalPrompt }];
`;

code = code.replace(
  "const finalPrompt = \`\${systemContext}\\n\\n\${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}[HISTORY]\\n\${historyContext}\\n\\nUSER: \${userInput}\`;",
  imagePartsDef
);

code = code.replace(
  /contents: \{ parts: \[\{ text: finalPrompt \}\] \}/g,
  "contents: { parts: requestParts }"
);

fs.writeFileSync('llmService.ts', code);
console.log("llmService.ts image injection patched");
