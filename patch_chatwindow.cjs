const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

code = code.replace(
  '  statusMessage,\n  currentNodeId,\n  onNodeTransition?: string;\n  currentNodeId?: string;\n  onNodeTransition?: (nodeId: string) => void;',
  '  statusMessage?: string;\n  currentNodeId?: string;\n  onNodeTransition?: (nodeId: string) => void;'
);

code = code.replace(
  'onClick={() => msg.content && setViewingImage(msg.content)}',
  '/* onClick={() => msg.content && setViewingImage(msg.content)} */'
);

fs.writeFileSync('components/ChatWindow.tsx', code);
console.log("ChatWindow.tsx patched");
