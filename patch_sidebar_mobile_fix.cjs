const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

code = code.replace(
  '<div className={`fixed md:relative z-40',
  '<div className={`fixed top-0 left-0 bottom-0 md:relative z-40'
);

// Check if we already have the close button
if (!code.includes("onClick={onCloseMobile}")) {
  console.log("No onCloseMobile?");
}

fs.writeFileSync('components/Sidebar.tsx', code);
console.log("Sidebar.tsx fixed positioning");
