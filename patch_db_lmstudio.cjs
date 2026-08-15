const fs = require('fs');
let code = fs.readFileSync('db.ts', 'utf8');

if (!code.includes("lmStudioModel: '',")) {
  code = code.replace(
    "lmStudioUrl: 'http://localhost:1234/v1',", 
    "lmStudioUrl: 'http://localhost:1234/v1',\n  lmStudioModel: '',"
  );
  fs.writeFileSync('db.ts', code);
  console.log("Patched db.ts");
}
