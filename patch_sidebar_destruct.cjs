const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

code = code.replace(
  '  onDeleteScenario,\n  onEditScenario\n})',
  '  onDeleteScenario,\n  onEditScenario,\n  onOpenGraphEditor\n})'
);

fs.writeFileSync('components/Sidebar.tsx', code);
console.log("Sidebar.tsx destruct patched");
