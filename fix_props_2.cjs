const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

const badProps = `  onNodeTransition,
  onMoodChange?: (nodeId: string) => void;
  onMoodChange?: (mood: string, reason: string) => void;`;

const goodProps = `  onNodeTransition?: (nodeId: string) => void;
  onMoodChange?: (mood: string, reason: string) => void;`;

code = code.replace(badProps, goodProps);

const badDestruct = `  statusMessage
}) => {`;

const goodDestruct = `  statusMessage,
  onNodeTransition,
  onMoodChange
}) => {`;

code = code.replace(badDestruct, goodDestruct);

fs.writeFileSync('components/ChatWindow.tsx', code);
