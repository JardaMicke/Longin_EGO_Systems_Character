const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

if (!code.includes("lmStudioModel: string;")) {
  code = code.replace(
    "lmStudioUrl: string;", 
    "lmStudioUrl: string;\n  lmStudioModel: string;"
  );
  fs.writeFileSync('types.ts', code);
  console.log("Patched types.ts");
}
