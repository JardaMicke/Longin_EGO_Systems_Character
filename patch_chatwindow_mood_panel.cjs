const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

code = code.replace(
  '  onNodeTransition?: (nodeId: string) => void;',
  '  onNodeTransition?: (nodeId: string) => void;\n  onMoodChange?: (mood: string, reason: string) => void;'
);

code = code.replace(
  '  onNodeTransition',
  '  onNodeTransition,\n  onMoodChange'
);

code = code.replace(
  "  const [searchTag, setSearchTag] = useState('');",
  "  const [searchTag, setSearchTag] = useState('');\n  const [showMoodPanel, setShowMoodPanel] = useState(false);\n  const [customMoodReason, setCustomMoodReason] = useState('');"
);

// We want to add an onClick handler to the avatar wrapper
code = code.replace(
  '<div className="relative group cursor-pointer w-12 h-12">',
  '<div className="relative group cursor-pointer w-12 h-12" onClick={() => setShowMoodPanel(!showMoodPanel)}>'
);

const panelHTML = `
        {/* Mood Panel */}
        {showMoodPanel && (
          <div className="absolute top-20 left-8 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm">Aktuální nálada: <span className="capitalize text-pink-400">{currentMood}</span></h3>
              <button onClick={() => setShowMoodPanel(false)} className="text-slate-500 hover:text-white p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Manuální změna nálady</p>
                <div className="grid grid-cols-3 gap-2">
                  {['happy', 'sad', 'energetic', 'calm', 'angry', 'mysterious', 'seductive'].map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        if (onMoodChange) onMoodChange(m, customMoodReason || 'Manuálně změněno uživatelem');
                        setShowMoodPanel(false);
                        setCustomMoodReason('');
                      }}
                      className={\`text-xs font-bold py-1.5 rounded-lg border transition-all capitalize \${currentMood === m ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}\`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  placeholder="Důvod změny (volitelné)"
                  value={customMoodReason}
                  onChange={(e) => setCustomMoodReason(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-pink-500/50"
                />
              </div>

              {character.moodHistory && character.moodHistory.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Historie nálad</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {[...character.moodHistory].reverse().map((mem, idx) => (
                      <div key={idx} className="bg-black/40 rounded p-2 text-xs border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-pink-400 capitalize">{mem.mood}</span>
                          <span className="text-[9px] text-slate-500">{new Date(mem.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-300 leading-tight">{mem.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
`;

code = code.replace(
  '        <div className="flex-1 flex items-center gap-4">',
  panelHTML + '\n        <div className="flex-1 flex items-center gap-4">'
);

fs.writeFileSync('components/ChatWindow.tsx', code);
console.log("ChatWindow.tsx patched with Mood Panel");
