const fs = require('fs');

let types = fs.readFileSync('types.ts', 'utf8');
types = types.replace(
  '  moodSoundEnabled: boolean;',
  '  moodSoundEnabled: boolean;\n  globalInstructions?: string;'
);
fs.writeFileSync('types.ts', types);

let db = fs.readFileSync('db.ts', 'utf8');
db = db.replace(
  '  moodSoundEnabled: true,',
  '  moodSoundEnabled: true,\n  globalInstructions: "",'
);
fs.writeFileSync('db.ts', db);
console.log("types.ts and db.ts patched");
