const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. Add onMenuClick to ChatWindow
if (!code.includes("onMenuClick={() => setShowMobileSidebar(true)}")) {
  code = code.replace(
    "<ChatWindow \\n",
    "<ChatWindow \\n          onMenuClick={() => setShowMobileSidebar(true)}\\n"
  );
}

// 2. Add hamburger to empty state
const emptyStateHamburger = `
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#050505] relative">
          <button 
            onClick={() => setShowMobileSidebar(true)} 
            className="md:hidden absolute top-6 left-6 p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10 border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
`;

code = code.replace(
  '<div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#050505] relative">',
  emptyStateHamburger
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx empty state and ChatWindow mobile props patched");
