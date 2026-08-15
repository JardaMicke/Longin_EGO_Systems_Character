const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

if (!code.includes("currentNodeId?: string;")) {
  code = code.replace(
    "isNarratorMode: boolean;", 
    "isNarratorMode: boolean;\n  currentNodeId?: string;"
  );
  fs.writeFileSync('types.ts', code);
  console.log("Patched types.ts with currentNodeId");
}
