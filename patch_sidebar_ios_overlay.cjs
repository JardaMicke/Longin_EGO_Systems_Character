const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

code = code.replace(
  '<div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={onCloseMobile} />',
  '<div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm cursor-pointer touch-manipulation" onClick={onCloseMobile} />'
);

fs.writeFileSync('components/Sidebar.tsx', code);
console.log("Sidebar.tsx patched for iOS overlay click");
