const fs = require('fs');
let code = fs.readFileSync('components/ImageViewer.tsx', 'utf8');

if (!code.includes('const [rotation, setRotation]')) {
  code = code.replace(
    'const [position, setPosition] = useState({ x: 0, y: 0 });',
    'const [position, setPosition] = useState({ x: 0, y: 0 });\n  const [rotation, setRotation] = useState(0);'
  );

  const rotateButton = `
        <button 
          onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-colors"
          title="Rotate 90°"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
  `;

  // Insert the rotate button before the close button
  code = code.replace(
    '<button \n          onClick={(e) => { e.stopPropagation(); onClose(); }}',
    rotateButton + '\n        <button \n          onClick={(e) => { e.stopPropagation(); onClose(); }}'
  );

  // Note: I used the same icon for reset and rotate above, let me fix the reset icon and use a different rotate icon.
  const fixResetIcon = `
        <button 
          onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({x:0, y:0}); setRotation(0); }}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        </button>
  `;
  
  // Actually, I'll just rewrite the button block for cleaner replacement
  const newButtonsBlock = `
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <button 
          onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-colors"
          title="Rotate 90°"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({x:0, y:0}); setRotation(0); }}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8m0 0V4m0 4h4" /></svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="bg-rose-500/80 hover:bg-rose-500 p-3 rounded-full text-white backdrop-blur-md transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
  `;

  // Replace old button block
  code = code.replace(
    /<div className="absolute top-4 right-4 z-10 flex gap-4">[\s\S]*?<\/div>/,
    newButtonsBlock
  );

  // Update style tag
  code = code.replace(
    'transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,',
    'transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`, \n          transition: isDragging.current ? "none" : "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",'
  );

  fs.writeFileSync('components/ImageViewer.tsx', code);
  console.log("ImageViewer.tsx patched with rotation");
}
