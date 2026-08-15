const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

code = code.replace(
  '  onMoodChange?: (mood: string, reason: string) => void;',
  '  onMoodChange?: (mood: string, reason: string) => void;\n  isVoiceEnabled?: boolean;\n  onToggleVoice?: () => void;'
);

code = code.replace(
  '  onMoodChange\n})',
  '  onMoodChange,\n  isVoiceEnabled,\n  onToggleVoice\n})'
);

const voiceToggleBtn = `
             <button type="button" onClick={onToggleVoice} className={\`group flex items-center gap-3 px-5 py-2.5 border rounded-2xl transition-all \${isVoiceEnabled ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-black/40 hover:bg-white/5 border-white/5 opacity-50 hover:opacity-100'}\`}>
                {isVoiceEnabled ? (
                  <svg className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 19L5 13H2V7h3l6-6v18z" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                )}
                <span className={\`text-[10px] font-black uppercase tracking-widest \${isVoiceEnabled ? 'text-green-400' : 'text-slate-400'}\`}>Voice</span>
             </button>
`;

code = code.replace(
  '             </button>\n          </div>',
  '             </button>\n' + voiceToggleBtn + '          </div>'
);

fs.writeFileSync('components/ChatWindow.tsx', code);
console.log("ChatWindow.tsx patched with voice toggle UI");
