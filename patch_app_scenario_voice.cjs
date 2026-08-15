const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  '        setScenarioChats(prev => ({ ...prev, [selectedScenarioId]: updatedWithText }));\n        db.saveScenarioChat(selectedScenarioId, updatedWithText);\n      }',
  '        setScenarioChats(prev => ({ ...prev, [selectedScenarioId]: updatedWithText }));\n        db.saveScenarioChat(selectedScenarioId, updatedWithText);\n        if (settings.voiceEnabled) playVoice(result.text, settings, "Puck");\n      }'
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched for scenario voice");
