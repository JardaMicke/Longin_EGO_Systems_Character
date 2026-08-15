const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

if (!code.includes("onOpenGraphEditor={")) {
  code = code.replace(
    "onDeleteScenario={handleDeleteScenario}",
    "onDeleteScenario={handleDeleteScenario}\n        onOpenGraphEditor={(scenario) => {\n          setSelectedScenarioId(scenario.id);\n          setShowGraphEditor(true);\n        }}"
  );
  fs.writeFileSync('App.tsx', code);
  console.log("App.tsx Sidebar props patched");
}
