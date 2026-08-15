const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const moodHandler = `
          } else if (call.name === 'update_mood') {
            const newMood = call.args.new_mood;
            const reason = call.args.reason;
            if (newMood) {
               setCharacters(prev => {
                 const newChars = prev.map(c => {
                   if (c.id === char.id) {
                     const updatedChar = { ...c, mood: newMood };
                     const moodMem = { mood: newMood, timestamp: Date.now(), reason: reason || 'Conversation context' };
                     updatedChar.moodHistory = [...(c.moodHistory || []), moodMem];
                     return updatedChar;
                   }
                   return c;
                 });
                 db.saveCharacters(newChars);
                 return newChars;
               });
               setStatusMessage(\`\${char.name} se cítí: \${newMood}\`);
            }
`;

code = code.replace(
  "} else if (call.name === 'generate_video') {",
  moodHandler + "} else if (call.name === 'generate_video') {"
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched for update_mood tool handling");
