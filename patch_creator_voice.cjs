const fs = require('fs');
let code = fs.readFileSync('components/CharacterCreator.tsx', 'utf8');

// Add playVoice import if missing
if (!code.includes('playVoice')) {
  code = code.replace(
    'analyzeCharacterImages } from \'../llmService\';',
    'analyzeCharacterImages, playVoice } from \'../llmService\';'
  );
}

// Add state for voiceName
code = code.replace(
  'const [mood, setMood] = useState<CharacterMood>(\'calm\');',
  'const [mood, setMood] = useState<CharacterMood>(\'calm\');\n  const [voiceName, setVoiceName] = useState(\'Kore\');'
);

// Add to save object
code = code.replace(
  'mood,\n      greeting,',
  'mood,\n      greeting,\n      voiceName,'
);

// Add voice selector UI after mood UI
const voiceUI = `
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Hlas (Voice)</label>
                  <div className="flex gap-4 items-center">
                    <select 
                      value={voiceName}
                      onChange={e => setVoiceName(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4 text-white font-semibold outline-none focus:border-pink-500/50 flex-1 transition-all"
                    >
                      <option value="Kore">Kore (Ženský, neutrální)</option>
                      <option value="Aoede">Aoede (Ženský, jemný)</option>
                      <option value="Puck">Puck (Mužský/Chlapecký, energický)</option>
                      <option value="Charon">Charon (Mužský, hluboký)</option>
                      <option value="Fenrir">Fenrir (Mužský, drsný)</option>
                    </select>
                    <button 
                      type="button"
                      onClick={() => playVoice('Ahoj, takhle zní můj hlas. Doufám, že se ti líbí!', { voiceEnabled: true } as any, voiceName)}
                      className="p-4 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-[1.5rem] transition-colors border border-pink-500/20 flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      Otestovat
                    </button>
                  </div>
                </div>
`;

code = code.replace(
  '</div>\n                </div>\n\n                <div className="space-y-5">\n                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.quirks}</label>',
  '</div>\n                </div>\n' + voiceUI + '\n                <div className="space-y-5">\n                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.quirks}</label>'
);

fs.writeFileSync('components/CharacterCreator.tsx', code);
console.log("CharacterCreator.tsx patched with Voice");
