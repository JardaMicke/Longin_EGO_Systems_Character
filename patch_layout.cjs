const fs = require('fs');

// 1. App.tsx
let appCode = fs.readFileSync('App.tsx', 'utf8');
appCode = appCode.replace(
  '<div className="flex h-[100dvh] bg-black text-slate-100">',
  '<div className="flex h-[100dvh] w-full bg-black text-slate-100 relative overflow-hidden">'
);
fs.writeFileSync('App.tsx', appCode);
console.log("App.tsx patched");

// 2. Sidebar.tsx
let sidebarCode = fs.readFileSync('components/Sidebar.tsx', 'utf8');

// Ensure absolute fixed positioning and higher z-index
sidebarCode = sidebarCode.replace(
  /className={`fixed top-0 left-0 bottom-0 md:relative z-40 w-80 max-w-\[85vw\] h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 \$\{isOpen \? 'translate-x-0' : '-translate-x-full md:translate-x-0'\}`}/,
  'className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 shadow-2xl ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}'
);

// Update close button to make it extremely clear
const newCloseButton = `
          <button 
            onClick={onCloseMobile}
            className="md:hidden flex items-center justify-center gap-2 px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-lg transition-colors text-pink-500 font-bold text-xs uppercase tracking-wider"
          >
            Zavřít
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
`;

sidebarCode = sidebarCode.replace(
  /<button \s*onClick={onCloseMobile}[\s\S]*?<\/button>/,
  newCloseButton
);

// Ensure the backdrop has z-40
sidebarCode = sidebarCode.replace(
  '<div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"',
  '<div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"'
);

fs.writeFileSync('components/Sidebar.tsx', sidebarCode);
console.log("Sidebar.tsx patched");

