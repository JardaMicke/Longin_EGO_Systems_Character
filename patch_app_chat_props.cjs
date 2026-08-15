const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const oldChatProps = "<ChatWindow \\n          character={selectedChar";

const addProps = `
          currentNodeId={selectedScenarioId ? scenarioChats[selectedScenarioId]?.currentNodeId : undefined}
          onNodeTransition={(nodeId) => {
            if (selectedScenarioId) {
              setScenarioChats(prev => ({
                ...prev,
                [selectedScenarioId]: {
                  ...prev[selectedScenarioId],
                  currentNodeId: nodeId
                }
              }));
              // Add system message about transition
              const sysMsg: Message = {
                id: (Date.now()).toString(),
                role: 'system',
                content: \`[SCENE TRANSITION] \${scenarios.find(s => s.id === selectedScenarioId)?.nodes?.find(n => n.id === nodeId)?.data?.label || 'New Scene'}\`,
                timestamp: Date.now(),
                type: 'system',
                mode: 'scenario'
              };
              setScenarioChats(prev => ({
                ...prev,
                [selectedScenarioId]: {
                  ...prev[selectedScenarioId],
                  messages: [...(prev[selectedScenarioId]?.messages || []), sysMsg]
                }
              }));
            }
          }}
`;

if (code.includes("<ChatWindow \n          character={selectedChar")) {
  code = code.replace("<ChatWindow \n          character={selectedChar", "<ChatWindow \n" + addProps + "          character={selectedChar");
  fs.writeFileSync('App.tsx', code);
  console.log("App.tsx ChatWindow props patched");
} else {
  console.log("Could not find ChatWindow props in App.tsx");
}
