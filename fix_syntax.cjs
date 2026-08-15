const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

code = code.replace("const currentMood = character.mood || 'happy';\\n", "const currentMood = character.mood || 'happy';\n");
code = code.replace("const currentMood = character.mood || 'happy';\\\\n", "const currentMood = character.mood || 'happy';\n");

fs.writeFileSync('components/ChatWindow.tsx', code);
