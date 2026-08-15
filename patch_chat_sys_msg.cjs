const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

const sysMsgCheck = `
            {msg.role === 'system' ? (
              <div className="w-full flex justify-center py-4">
                 <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2 text-center shadow-inner flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{msg.content}</span>
                 </div>
              </div>
            ) : msg.type === 'narration' ? (
`;

if (code.includes("{msg.type === 'narration' ? (")) {
  code = code.replace("{msg.type === 'narration' ? (", sysMsgCheck);
  fs.writeFileSync('components/ChatWindow.tsx', code);
  console.log("ChatWindow patched for system messages");
} else {
  console.log("Could not find narration check in ChatWindow");
}
