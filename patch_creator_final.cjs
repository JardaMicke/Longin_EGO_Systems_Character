const fs = require('fs');
let code = fs.readFileSync('components/CharacterCreator.tsx', 'utf8');

const galleryContent = `
              <div className="mb-8 bg-white/5 border border-white/10 rounded-[2rem] p-6">
                 <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">{(t as any).context_gallery || 'Kontext a Galerie'}</h3>
                 <p className="text-xs text-slate-400 mb-6">
                   {(t as any).context_gallery_hint || 'Přiložte fotografie, videa nebo textové dokumenty. Čím více kontextu, tím lépe bude AI charakter chápat.'}
                 </p>
                 <div 
                   onClick={() => photoUploadRef.current?.click()}
                   className="border-2 border-dashed border-white/10 rounded-[1.5rem] p-6 hover:border-pink-500/50 hover:bg-white/5 transition-all cursor-pointer group text-center"
                 >
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,video/*,text/plain" 
                      ref={photoUploadRef} 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-pink-600/20 rounded-full flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                        {isAnalyzing ? (
                          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">Přidat soubory</p>
                      </div>
                    </div>
                 </div>
                 
                 {contextMedia.length > 0 && (
                   <div className="mt-6 space-y-4">
                     <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                       {contextMedia.map((media) => (
                         <div key={media.id} className="relative group/media shrink-0">
                           {media.type === 'image' && (
                             <img src={media.data.startsWith('data:') ? media.data : \`data:\${media.mimeType};base64,\${media.data}\`} className="w-24 h-24 rounded-xl object-cover border border-white/10" alt="uploaded" />
                           )}
                           {media.type === 'video' && (
                             <div className="w-24 h-24 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                               <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                             </div>
                           )}
                           {media.type === 'text' && (
                             <div className="w-24 h-24 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center flex-col p-2 text-center overflow-hidden">
                               <svg className="w-6 h-6 text-slate-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                               <span className="text-[8px] text-slate-400 break-all line-clamp-2">{media.name || 'Text'}</span>
                             </div>
                           )}
                           <button 
                             type="button"
                             onClick={() => removeMedia(media.id)}
                             className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 rounded-full flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity text-white hover:bg-rose-500 shadow-lg"
                           >
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                         </div>
                       ))}
                     </div>
                     <button 
                       type="button" 
                       onClick={handleAnalyzePhotos}
                       disabled={isAnalyzing || !contextMedia.some(m => m.type === 'image')}
                       className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-pink-500 transition-all border border-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                       {isAnalyzing ? (
                         <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                       )}
                       {t.analyze_photos}
                     </button>
                   </div>
                 )}
              </div>
`;

// Replace from {activeTab === 'basic' && (\n              <div className="mb-8 ... to the end of the second {activeTab === 'basic'
// Let's use a split approach.
let lines = code.split('\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'basic' && (") && lines[i+1] && lines[i+1].includes('mb-8 bg-white/5 border border-white/10 rounded-[2rem]')) {
    skip = true;
    continue;
  }
  
  if (skip) {
    if (lines[i].includes("{activeTab === 'basic' && (")) {
      skip = false;
      // We reached the actual basic tab start. Add it and the gallery.
      newLines.push("            {activeTab === 'basic' && (");
      newLines.push("              <div className=\"space-y-8 animate-in fade-in slide-in-from-right-8 duration-500\">");
      newLines.push(galleryContent);
      i += 1; // skip the next line which is the original `<div className="space-y-8 ...` because we just added it.
      continue;
    } else {
      continue; // keep skipping
    }
  }
  
  newLines.push(lines[i]);
}

fs.writeFileSync('components/CharacterCreator.tsx', newLines.join('\n'));
console.log("CharacterCreator.tsx completely fixed");
