const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add import
code = code.replace(
  "import { ImageGenDialog } from './components/ImageGenDialog';",
  "import { ImageGenDialog } from './components/ImageGenDialog';\nimport { ImageEditorDialog } from './components/ImageEditorDialog';"
);

// Add state
code = code.replace(
  "const [showImageGen, setShowImageGen] = useState(false);",
  "const [showImageGen, setShowImageGen] = useState(false);\n  const [showImageEditor, setShowImageEditor] = useState(false);"
);

// Pass to Sidebar
code = code.replace(
  "onOpenSettings={() => setShowSettings(true)}",
  "onOpenSettings={() => setShowSettings(true)}\n        onOpenImageEditor={() => { setShowImageEditor(true); setShowMobileSidebar(false); }}"
);

// Add component render
const dialogHtml = `
      {showImageEditor && (
        <ImageEditorDialog 
          language={settings.language}
          onClose={() => setShowImageEditor(false)}
        />
      )}
`;

code = code.replace(
  "      {showImageGen && (",
  dialogHtml + "\n      {showImageGen && ("
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched with image editor");
