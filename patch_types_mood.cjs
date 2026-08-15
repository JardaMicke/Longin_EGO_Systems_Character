const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

const moodHistoryType = `
export interface MoodMemory {
  mood: CharacterMood;
  timestamp: number;
  reason: string;
}
`;

code = code.replace(
  'export interface Character {',
  moodHistoryType + '\nexport interface Character {'
);

code = code.replace(
  '  mood?: CharacterMood;',
  '  mood?: CharacterMood;\n  moodHistory?: MoodMemory[];'
);

fs.writeFileSync('types.ts', code);
console.log("types.ts patched with MoodMemory");
