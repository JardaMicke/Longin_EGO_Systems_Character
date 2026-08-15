const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

code = code.replace(
  'const [message, setMessage] = useState(\'\');',
  'const [message, setMessage] = useState(\'\');\n  const [viewingImage, setViewingImage] = useState<string | null>(null);'
);

code = code.replace(
  '/* onClick={() => msg.content && setViewingImage(msg.content)} */',
  'onClick={() => msg.content && setViewingImage(msg.content)}'
);

const imageViewerHtml = `
      {viewingImage && (
        <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />
      )}
`;

code = code.replace(
  'return (\n    <div className=',
  imageViewerHtml + 'return (\n    <div className='
);

fs.writeFileSync('components/ChatWindow.tsx', code);
console.log("ChatWindow.tsx patched with ImageViewer");
