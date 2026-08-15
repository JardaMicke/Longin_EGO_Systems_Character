const fs = require('fs');
let types = fs.readFileSync('types.ts', 'utf8');

types = types.replace(
  '  voiceAccentStrength: number;',
  '  voiceAccentStrength: number;\n  uiVolume: number;\n  messageSoundEnabled: boolean;\n  moodSoundEnabled: boolean;'
);
fs.writeFileSync('types.ts', types);

let db = fs.readFileSync('db.ts', 'utf8');
db = db.replace(
  '  voiceAccentStrength: 0.5,',
  '  voiceAccentStrength: 0.5,\n  uiVolume: 0.5,\n  messageSoundEnabled: true,\n  moodSoundEnabled: true,'
);
fs.writeFileSync('db.ts', db);
console.log("types.ts and db.ts patched");
