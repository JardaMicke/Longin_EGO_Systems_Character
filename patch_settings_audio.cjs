const fs = require('fs');
let code = fs.readFileSync('components/Settings.tsx', 'utf8');

const audioSection = `
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-300">Zvuky & UI Efekty</h3>
            
            <div className="space-y-4 p-4 bg-slate-800/30 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Zvuk nové zprávy</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Přehrát upozornění při nové zprávě</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.messageSoundEnabled}
                    onChange={e => setFormData({...formData, messageSoundEnabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Zvuk změny nálady</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Přehrát efekt při změně emocí charakteru</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.moodSoundEnabled}
                    onChange={e => setFormData({...formData, moodSoundEnabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Hlasitost UI efektů</label>
                  <span className="text-xs font-bold text-slate-400">{Math.round(formData.uiVolume * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={formData.uiVolume}
                  onChange={e => setFormData({...formData, uiVolume: parseFloat(e.target.value)})}
                  className="w-full accent-pink-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
`;

code = code.replace(
  '<div className="pt-4 border-t border-slate-800 space-y-4">\\n            <h3 className="text-sm font-bold text-slate-300">{t.voice_assistant}</h3>',
  audioSection + '\\n          <div className="pt-4 border-t border-slate-800 space-y-4">\\n            <h3 className="text-sm font-bold text-slate-300">{t.voice_assistant}</h3>'
);

fs.writeFileSync('components/Settings.tsx', code);
console.log("Settings.tsx patched with audio controls");
