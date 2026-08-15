const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  'if (result.toolCalls) {\n        for (const call of result.toolCalls) {',
  'if (result.toolCalls) {\n        let currentIteratedMood = char.mood;\n        for (const call of result.toolCalls) {'
);

code = code.replace(
  'if (newMood) {\n               setCharacters(prev => {',
  'if (newMood) {\n               currentIteratedMood = newMood;\n               setCharacters(prev => {'
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched for synchronous mood updates properly");
