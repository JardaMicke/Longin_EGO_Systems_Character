const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

code = code.replace(
  'z-40 md:hidden backdrop-blur-sm',
  'z-[90] md:hidden backdrop-blur-sm'
);

code = code.replace(
  'z-50 w-80 max-w-[85vw]',
  'z-[100] w-80 max-w-[85vw] pointer-events-auto'
);

fs.writeFileSync('components/Sidebar.tsx', code);
console.log("Sidebar.tsx z-index patched");
