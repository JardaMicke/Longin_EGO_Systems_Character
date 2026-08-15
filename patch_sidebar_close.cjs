const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

const closeButton = `
        <div className="flex gap-2">
          <button 
            onClick={onOpenSettings}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors text-pink-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
`;

code = code.replace(
  /<button \s*onClick={onOpenSettings}[\s\S]*?<\/button>/,
  closeButton
);

// Sidebar should not force 100vw, but w-80 is fine as long as there is a close button.
// Actually, let's make it w-72 or w-80 max-w-full.
code = code.replace(
  'w-80 h-full bg-slate-900',
  'w-80 max-w-[85vw] h-full bg-slate-900'
);

fs.writeFileSync('components/Sidebar.tsx', code);
console.log("Sidebar.tsx patched with close button");
