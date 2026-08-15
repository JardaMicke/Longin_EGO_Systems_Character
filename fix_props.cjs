const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

code = code.replace(
  '  onNodeTransition,\\n  onMoodChange?: (nodeId: string) => void;\\n  onMoodChange?: (mood: string, reason: string) => void;',
  '  onNodeTransition?: (nodeId: string) => void;\\n  onMoodChange?: (mood: string, reason: string) => void;'
);

fs.writeFileSync('components/ChatWindow.tsx', code);
