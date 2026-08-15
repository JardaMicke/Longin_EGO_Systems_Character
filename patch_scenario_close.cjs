const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

if (!code.includes('onSelectScenario={(id) => {')) {
  console.log('Not found');
} else {
  code = code.replace(
    "setIsNarratorMode(scenarioChats[id]?.isNarratorMode || false);",
    "setIsNarratorMode(scenarioChats[id]?.isNarratorMode || false);\n          setShowMobileSidebar(false);"
  );
  fs.writeFileSync('App.tsx', code);
  console.log('App.tsx patched for scenario close');
}
