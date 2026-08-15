const fs = require('fs');

// 1. Patch index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('overflow: hidden;', '/* overflow: hidden removed to allow mobile zoom panning */');
// Add touch-action manipulation to allow zooming
html = html.replace(
    '</style>',
    'html { touch-action: manipulation; }\n    </style>'
);
fs.writeFileSync('index.html', html);
console.log("index.html patched");

// 2. Patch App.tsx
let appCode = fs.readFileSync('App.tsx', 'utf8');
appCode = appCode.replace(
  'className="flex h-screen bg-black text-slate-100 overflow-hidden"',
  'className="flex h-[100dvh] bg-black text-slate-100"'
);
fs.writeFileSync('App.tsx', appCode);
console.log("App.tsx patched");

