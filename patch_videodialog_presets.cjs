const fs = require('fs');
let code = fs.readFileSync('components/VideoGenDialog.tsx', 'utf8');

const presetsUI = `
          {/* Workflows / Presets */}
          <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-violet-500/20 mb-4">
            <label className="text-[10px] font-black uppercase text-violet-400 tracking-[0.2em] mb-4 block flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              Director's Flows (Consistent Characters)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setParams({...params, useConsistentCharacter: true, photorealisticBoost: true, resolution: '1080p'})}
                className={\`flex flex-col items-center text-center p-4 rounded-2xl border transition-all \${params.photorealisticBoost && params.useConsistentCharacter ? 'bg-violet-600/20 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-black/40 border-white/5 hover:border-violet-500/50'}\`}
              >
                <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center mb-2 text-violet-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-white mb-1">Photorealistic Consistent Subject</span>
                <span className="text-[9px] text-slate-400">Enforces FaceID into video generation</span>
              </button>

              <button
                onClick={() => setParams({...params, useConsistentCharacter: false, photorealisticBoost: false, resolution: '720p'})}
                className={\`flex flex-col items-center text-center p-4 rounded-2xl border transition-all \${!params.photorealisticBoost && !params.useConsistentCharacter ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-black/40 border-white/5 hover:border-indigo-500/50'}\`}
              >
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mb-2 text-indigo-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-white mb-1">Standard Scene (Open World)</span>
                <span className="text-[9px] text-slate-400">Allows general scenery without face locking</span>
              </button>
            </div>
          </div>
`;

if (!code.includes("Director's Flows (Consistent Characters)")) {
  code = code.replace(
    "{/* Category Tabs */}",
    presetsUI + "\n          {/* Category Tabs */}"
  );
  
  // Set default params state to include useConsistentCharacter and photorealisticBoost
  code = code.replace(
    "segments: 1",
    "segments: 1,\n    useConsistentCharacter: true,\n    photorealisticBoost: true"
  );
  
  fs.writeFileSync('components/VideoGenDialog.tsx', code);
  console.log("VideoGenDialog patched with presets");
}
