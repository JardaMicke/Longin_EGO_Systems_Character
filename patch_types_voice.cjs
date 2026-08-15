const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

code = code.replace(
  '  topP?: number;\n}',
  '  topP?: number;\n  voiceName?: string;\n}'
);

fs.writeFileSync('types.ts', code);
console.log("types.ts patched with voiceName");
