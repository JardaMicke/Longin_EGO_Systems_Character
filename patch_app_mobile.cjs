const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

if (!code.includes('showMobileSidebar')) {
  // Add state
  code = code.replace(
    "const [showSettings, setShowSettings] = useState(false);",
    "const [showSettings, setShowSettings] = useState(false);\n  const [showMobileSidebar, setShowMobileSidebar] = useState(false);"
  );

  // Update Sidebar props
  code = code.replace(
    "<Sidebar \n        characters={characters}",
    "<Sidebar \n        isOpen={showMobileSidebar}\n        onCloseMobile={() => setShowMobileSidebar(false)}\n        characters={characters}"
  );

  // Update ChatWindow props
  code = code.replace(
    "<ChatWindow \n          currentNodeId=",
    "<ChatWindow \n          onMenuClick={() => setShowMobileSidebar(true)}\n          currentNodeId="
  );

  fs.writeFileSync('App.tsx', code);
  console.log("App.tsx patched for mobile sidebar");
}
