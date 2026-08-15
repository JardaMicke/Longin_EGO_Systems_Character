const fs = require('fs');
let code = fs.readFileSync('components/CharacterCreator.tsx', 'utf8');

const targetSection = `                <div className="space-y-4">
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
                </div>`;

const replacement = `                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Hlasová Galerie (Voice Gallery)</label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-500/70">Zvolte hlas postavy</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'Kore', name: 'Kore', desc: 'Ženský, Neutrální', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'from-emerald-500/20 to-emerald-900/20', border: 'border-emerald-500/30' },
                      { id: 'Aoede', name: 'Aoede', desc: 'Ženský, Jemný', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: 'from-pink-500/20 to-pink-900/20', border: 'border-pink-500/30' },
                      { id: 'Puck', name: 'Puck', desc: 'Chlapecký, Energický', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'from-amber-500/20 to-amber-900/20', border: 'border-amber-500/30' },
                      { id: 'Charon', name: 'Charon', desc: 'Mužský, Hluboký', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', color: 'from-indigo-500/20 to-indigo-900/20', border: 'border-indigo-500/30' },
                      { id: 'Fenrir', name: 'Fenrir', desc: 'Mužský, Drsný', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', color: 'from-red-500/20 to-red-900/20', border: 'border-red-500/30' }
                    ].map(voice => (
                      <div 
                        key={voice.id}
                        onClick={() => setVoiceName(voice.id)}
                        className={\`relative group cursor-pointer overflow-hidden rounded-[1.5rem] border transition-all duration-300 p-4 flex items-center justify-between \${
                          voiceName === voice.id 
                            ? 'bg-gradient-to-br border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.15)] ' + voice.color 
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }\`}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={\`w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border \${voiceName === voice.id ? voice.border : 'border-white/10'}\`}>
                            <svg className={\`w-5 h-5 \${voiceName === voice.id ? 'text-white' : 'text-white/40'}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={voice.icon} /></svg>
                          </div>
                          <div>
                            <div className={\`font-bold text-sm transition-colors \${voiceName === voice.id ? 'text-white' : 'text-slate-300'}\`}>{voice.name}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{voice.desc}</div>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playVoice('Ahoj, takhle zní můj hlas. Doufám, že se ti líbí!', { voiceEnabled: true } as any, voice.id);
                          }}
                          className={\`p-3 rounded-full transition-all z-10 \${voiceName === voice.id ? 'bg-pink-500 text-white shadow-lg shadow-pink-900/50 hover:scale-110' : 'bg-black/40 text-slate-400 hover:text-white hover:bg-white/10'}\`}
                          title="Preview Voice"
                        >
                          <svg className="w-4 h-4 translate-x-[1px]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>`;

if (code.includes('Hlas (Voice)')) {
  code = code.replace(targetSection, replacement);
  fs.writeFileSync('components/CharacterCreator.tsx', code);
  console.log("CharacterCreator Voice Gallery patched successfully");
} else {
  console.log("Could not find the target section.");
}
