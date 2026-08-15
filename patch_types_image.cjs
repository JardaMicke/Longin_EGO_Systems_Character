const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

if (!code.includes("useConsistentCharacter?: boolean;")) {
  code = code.replace(
    "allAngles?: boolean;",
    "allAngles?: boolean;\n  useConsistentCharacter?: boolean;\n  photorealisticBoost?: boolean;"
  );
  fs.writeFileSync('types.ts', code);
  console.log("types.ts patched");
}
