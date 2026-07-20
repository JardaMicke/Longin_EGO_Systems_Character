const fs = require('fs');

// Fix db.ts
let dbContent = fs.readFileSync('db.ts', 'utf8');
dbContent = dbContent.replace(/gemini-3-flash-preview/g, 'gemini-3.5-flash');
fs.writeFileSync('db.ts', dbContent);

// Fix llmService.ts
let llmContent = fs.readFileSync('llmService.ts', 'utf8');
llmContent = llmContent.replace(/gemini-2\.5-flash-latest/g, 'gemini-3.5-flash');
llmContent = llmContent.replace(/gemini-3-pro-image-preview/g, 'gemini-3-pro-image');
llmContent = llmContent.replace(/gemini-2\.5-flash-image/g, 'gemini-3.1-flash-image');
llmContent = llmContent.replace(/gemini-2\.5-flash-preview-tts/g, 'gemini-3.1-flash-tts-preview');
fs.writeFileSync('llmService.ts', llmContent);

console.log('Fixed models');
