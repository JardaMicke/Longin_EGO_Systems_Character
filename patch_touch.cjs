const fs = require('fs');

// 1. Restore standard index.html behavior
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('html { touch-action: manipulation; }', '');
html = html.replace('/* overflow: hidden removed to allow mobile zoom panning */', 'overflow: hidden;');
fs.writeFileSync('index.html', html);
console.log("index.html patched");

// 2. Remove overflow-hidden from App.tsx root because they wanted zoom/pan of the whole app
let appCode = fs.readFileSync('App.tsx', 'utf8');
appCode = appCode.replace(
  '<div className="flex h-[100dvh] w-full bg-black text-slate-100 relative overflow-hidden">',
  '<div className="flex h-[100dvh] w-full bg-black text-slate-100 relative">'
);
fs.writeFileSync('App.tsx', appCode);
console.log("App.tsx patched");

