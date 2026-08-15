const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

code = code.replace(
  '  onOpenSettings: () => void;',
  '  onOpenSettings: () => void;\n  onOpenImageEditor: () => void;'
);

code = code.replace(
  '  onViewProfile,\n  onOpenSettings,\n  onOpenCreator,',
  '  onViewProfile,\n  onOpenSettings,\n  onOpenImageEditor,\n  onOpenCreator,'
);

const btnHtml = `
          <button 
            onClick={onOpenImageEditor}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors group relative"
            title={language === 'cs' ? 'Editor fotografií' : 'Photo Editor'}
          >
            <svg className="w-5 h-5 text-slate-400 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
`;

code = code.replace(
  '        <div className="flex gap-2">\n          <button',
  '        <div className="flex gap-2">\n' + btnHtml + '\n          <button'
);

fs.writeFileSync('components/Sidebar.tsx', code);
console.log("Sidebar.tsx patched with image editor button");
