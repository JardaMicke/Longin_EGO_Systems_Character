const fs = require('fs');
let code = fs.readFileSync('components/ProfileView.tsx', 'utf8');

const combinedImages = `
  const profileImages = profile?.gallery || [];
  const contextImages = (character.contextMedia || [])
    .filter(m => m.type === 'image')
    .map(m => m.data.startsWith('data:') ? m.data : \`data:\${m.mimeType};base64,\${m.data}\`);
  const images = [...profileImages, ...contextImages];
  
  const contextVideosAndDocs = (character.contextMedia || []).filter(m => m.type !== 'image');
`;

code = code.replace(
  'const images = profile?.gallery || [];',
  combinedImages
);

// Add context videos and docs rendering after the gallery
const contextFilesHtml = `
          {contextVideosAndDocs.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/5">
              <h4 className="text-xs uppercase font-black text-slate-500 tracking-[0.2em]">Context Files</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {contextVideosAndDocs.map((media) => (
                  <div key={media.id} className="relative aspect-square rounded-2xl bg-slate-900 border border-white/5 shadow-lg flex flex-col items-center justify-center p-4 text-center overflow-hidden group">
                    {media.type === 'video' ? (
                       <svg className="w-10 h-10 text-pink-500 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    ) : (
                       <svg className="w-10 h-10 text-violet-500 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                    <span className="text-[10px] text-slate-300 font-bold break-all line-clamp-2">{media.name || \`\${media.type} file\`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Action Buttons */}
`;

code = code.replace(
  '{/* Action Buttons */}',
  contextFilesHtml
);

fs.writeFileSync('components/ProfileView.tsx', code);
console.log("ProfileView patched");
