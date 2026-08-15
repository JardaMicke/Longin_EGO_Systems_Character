const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  'setCurrentMode(chats[id]?.currentMode || \'conversation\');',
  'setCurrentMode(chats[id]?.currentMode || \'conversation\');\n          setShowMobileSidebar(false);'
);

code = code.replace(
  'setIsNarratorMode(scenarioChats[id]?.isNarratorMode || false);',
  'setIsNarratorMode(scenarioChats[id]?.isNarratorMode || false);\n          setShowMobileSidebar(false);'
);

// Also add pointer-events-none to the empty state gradient just in case
code = code.replace(
  '<div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient',
  '<div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient'
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched");
