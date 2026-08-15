const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

code = code.replace(
  '<div className="p-4 flex-1 overflow-y-auto space-y-2 custom-scrollbar">',
  '<div className="p-4 flex-1 overflow-y-auto overscroll-contain space-y-2 custom-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>'
);

fs.writeFileSync('components/Sidebar.tsx', code);
console.log("Sidebar.tsx patched for iOS scroll");
