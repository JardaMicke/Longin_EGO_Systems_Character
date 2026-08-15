const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

code = code.replace(
  "const [input, setInput] = useState('');",
  "const [input, setInput] = useState('');\n  const [viewingImage, setViewingImage] = useState<string | null>(null);"
);

fs.writeFileSync('components/ChatWindow.tsx', code);
console.log("ChatWindow.tsx patched viewingImage");
