const fs = require('fs');
let code = fs.readFileSync('components/Settings.tsx', 'utf8');

const globalInstructionsHtml = `
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Global Instructions (Behavioral Overrides)</label>
            <p className="text-[10px] text-slate-500 mb-2">These instructions will be appended to every character's system prompt.</p>
            <textarea 
              className="w-full bg-slate-800 border-none rounded-lg p-2.5 focus:ring-1 focus:ring-pink-500 resize-y min-h-[80px] text-sm text-slate-300"
              placeholder="e.g., Always speak in a polite tone. Never use emojis."
              value={formData.globalInstructions || ''}
              onChange={e => setFormData({...formData, globalInstructions: e.target.value})}
            />
          </div>
`;

code = code.replace(
  '          </div>\n\n          <div className="pt-4 border-t border-slate-800">',
  '          </div>\n\n' + globalInstructionsHtml + '\n          <div className="pt-4 border-t border-slate-800">'
);

fs.writeFileSync('components/Settings.tsx', code);
console.log("Settings.tsx patched with global instructions");
