const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add import
if (!code.includes("import { ScenarioGraphEditor }")) {
  code = code.replace("import { ScenarioCreator } from './components/ScenarioCreator';", "import { ScenarioCreator } from './components/ScenarioCreator';\nimport { ScenarioGraphEditor } from './components/ScenarioGraphEditor';");
}

// Add state
if (!code.includes("const [showGraphEditor, setShowGraphEditor]")) {
  code = code.replace("const [showScenarioCreator, setShowScenarioCreator] = useState(false);", "const [showScenarioCreator, setShowScenarioCreator] = useState(false);\n  const [showGraphEditor, setShowGraphEditor] = useState(false);");
}

// Handle save
const handleSaveGraph = `
  const handleSaveGraph = async (updatedScenario: Scenario) => {
    const updated = scenarios.map(s => s.id === updatedScenario.id ? updatedScenario : s);
    setScenarios(updated);
    await db.saveScenarios(updated);
  };
`;
if (!code.includes("handleSaveGraph")) {
  code = code.replace("const handleSendMessage =", handleSaveGraph + "\n  const handleSendMessage =");
}

// Render component
const renderGraph = `
      {showGraphEditor && selectedScenario && (
        <ScenarioGraphEditor
          scenario={selectedScenario}
          onClose={() => setShowGraphEditor(false)}
          onSave={handleSaveGraph}
        />
      )}
`;
if (!code.includes("<ScenarioGraphEditor")) {
  code = code.replace("{showScenarioCreator && (", renderGraph + "\n      {showScenarioCreator && (");
}

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched for React Flow");
