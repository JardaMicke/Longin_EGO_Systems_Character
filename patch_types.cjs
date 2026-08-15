const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

code = code.replace(
  'tags?: string[];\n}',
  'tags?: string[];\n  nodes?: any[];\n  edges?: any[];\n}'
);

code = code.replace(
  "role: 'user' | 'assistant';",
  "role: 'user' | 'assistant' | 'system';"
);

code = code.replace(
  "type: 'text' | 'image' | 'video' | 'narration';",
  "type: 'text' | 'image' | 'video' | 'narration' | 'system';"
);

code = code.replace(
  'allAngles: boolean;',
  'allAngles: boolean;\n  useConsistentCharacter?: boolean;\n  photorealisticBoost?: boolean;'
);

fs.writeFileSync('types.ts', code);
console.log("types.ts patched");
