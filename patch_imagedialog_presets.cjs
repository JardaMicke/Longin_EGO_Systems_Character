const fs = require('fs');
let code = fs.readFileSync('components/ImageGenDialog.tsx', 'utf8');

const presetsUI = `
          {/* Workflows / Presets */}
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-pink-500/20 mb-4">
            <label className="text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] mb-4 block flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              Director's Flows (Quick Presets)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setParams({...params, style: 'Photorealistic', quality: '4K', aspectRatio: '3:4', pose: 'Standing', expression: 'Serious', useConsistentCharacter: true, photorealisticBoost: true})}
                className={\`flex flex-col items-center text-center p-4 rounded-xl border transition-all \${params.photorealisticBoost && params.useConsistentCharacter ? 'bg-pink-600/20 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-black/40 border-white/5 hover:border-pink-500/50'}\`}
              >
                <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center mb-2 text-pink-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-white mb-1">Consistent Photorealistic</span>
                <span className="text-[9px] text-slate-400">Enforces FaceID & 8K details</span>
              </button>

              <button
                onClick={() => setParams({...params, style: 'Cinematic', quality: '4K', aspectRatio: '16:9', pose: 'Action pose', useConsistentCharacter: false, photorealisticBoost: true})}
                className={\`flex flex-col items-center text-center p-4 rounded-xl border transition-all \${params.style === 'Cinematic' && params.aspectRatio === '16:9' ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-black/40 border-white/5 hover:border-indigo-500/50'}\`}
              >
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mb-2 text-indigo-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-xs font-bold text-white mb-1">Cinematic Action</span>
                <span className="text-[9px] text-slate-400">16:9 Wide, Dynamic Lighting</span>
              </button>

              <button
                onClick={() => setParams({...params, style: 'Photorealistic', quality: '1K', aspectRatio: '1:1', expression: 'Seductive', pose: 'Leaning', useConsistentCharacter: false, photorealisticBoost: false})}
                className={\`flex flex-col items-center text-center p-4 rounded-xl border transition-all \${params.aspectRatio === '1:1' && params.expression === 'Seductive' ? 'bg-rose-600/20 border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.2)]' : 'bg-black/40 border-white/5 hover:border-rose-500/50'}\`}
              >
                <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center mb-2 text-rose-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-white mb-1">Intimate Close-up</span>
                <span className="text-[9px] text-slate-400">Fast 1K, Focus on expression</span>
              </button>
            </div>
          </div>
`;

if (!code.includes("Director's Flows (Quick Presets)")) {
  code = code.replace(
    "<div className=\"grid grid-cols-1 md:grid-cols-2 gap-10\">",
    presetsUI + "\n          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-10\">"
  );
  fs.writeFileSync('components/ImageGenDialog.tsx', code);
  console.log("ImageGenDialog patched with presets");
}
