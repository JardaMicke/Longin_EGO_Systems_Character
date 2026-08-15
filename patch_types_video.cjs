const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

if (!code.includes("useConsistentCharacter?: boolean;", code.indexOf("export interface VideoGenerationParams"))) {
  code = code.replace(
    "segments: number;",
    "segments: number;\n  useConsistentCharacter?: boolean;\n  photorealisticBoost?: boolean;"
  );
  fs.writeFileSync('types.ts', code);
  console.log("types.ts video params patched");
}
