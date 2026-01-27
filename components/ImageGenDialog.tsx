
import React, { useState } from 'react';
import { ImageGenerationParams, AppLanguage } from '../types';
import { translations } from '../locales';

interface ImageGenDialogProps {
  onConfirm: (params: ImageGenerationParams) => void;
  onClose: () => void;
  isNsfw: boolean;
  language: AppLanguage;
}

export const ImageGenDialog: React.FC<ImageGenDialogProps> = ({ onConfirm, onClose, isNsfw, language }) => {
  const t = translations[language];
  const [params, setParams] = useState<ImageGenerationParams>({
    aspectRatio: '1:1',
    quality: '1K',
    style: 'Photorealistic',
    pose: 'Standing',
    expression: 'Happy',
    dressType: 'Casual',
    props: [],
    isSequential: false,
    count: 2,
    allAngles: false
  });

  const styles = ['Photorealistic', 'Cinematic', 'Anime', 'Oil Painting', 'Digital Art', 'Cyberpunk'];
  const expressions = ['Happy', 'Serious', 'Seductive', 'Surprised', 'Angry', 'Shy'];
  const poses = ['Standing', 'Sitting', 'Lying down', 'Action pose', 'Bending over', 'Leaning', 'Kneeling'];
  const dressTypes = ['Casual', 'Formal', 'Lingerie', 'Bikini', 'Nude', 'Cosplay', 'Gym wear'];
  const nsfwProps = ['Bondage chair', 'Fucking machine', 'Dildo', 'Mouth plug', 'Bondage bench', 'Handcuffs'];

  const toggleProp = (prop: string) => {
    setParams(prev => ({
      ...prev,
      props: prev.props.includes(prop) 
        ? prev.props.filter(p => p !== prop) 
        : [...prev.props, prop]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0c0c0e] w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t.generate_moment}</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{t.personal_data}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Grid Layout for Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Basic Config */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-pink-500 tracking-[0.2em] mb-4 block">{t.format_quality}</label>
                <div className="flex gap-2">
                  {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map(ar => (
                    <button
                      key={ar}
                      onClick={() => setParams({...params, aspectRatio: ar})}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${params.aspectRatio === ar ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/20' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {(['1K', '2K', '4K'] as const).map(q => (
                    <button
                      key={q}
                      onClick={() => setParams({...params, quality: q})}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${params.quality === q ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 block">{t.visual_style}</label>
                <div className="grid grid-cols-3 gap-2">
                  {styles.map(s => (
                    <button
                      key={s}
                      onClick={() => setParams({...params, style: s})}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${params.style === s ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 block">{t.character_pose}</label>
                <div className="grid grid-cols-3 gap-2">
                  {poses.map(p => (
                    <button
                      key={p}
                      onClick={() => setParams({...params, pose: p})}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${params.pose === p ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Look & Feel */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 block">{t.facial_expression}</label>
                <div className="grid grid-cols-3 gap-2">
                  {expressions.map(e => (
                    <button
                      key={e}
                      onClick={() => setParams({...params, expression: e})}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${params.expression === e ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 block">{t.clothing}</label>
                <div className="flex flex-wrap gap-2">
                  {dressTypes.map(d => (
                    <button
                      key={d}
                      onClick={() => setParams({...params, dressType: d})}
                      className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all ${params.dressType === d ? 'bg-pink-600/20 border-pink-500/50 text-pink-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Props Section (NSFW) */}
          {isNsfw && (
            <div className="pt-8 border-t border-white/5">
              <label className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em] mb-4 block">{t.special_props}</label>
              <div className="flex flex-wrap gap-2">
                {nsfwProps.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleProp(p)}
                    className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${params.props.includes(p) ? 'bg-rose-600/20 border-rose-500 text-rose-400' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Series Options */}
          <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <h4 className="font-bold text-white text-sm">{t.sequential_shots}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Generate image series</p>
              </div>
              <div className="flex items-center gap-4">
                {params.isSequential && (
                   <input 
                    type="number" min="2" max="4" 
                    value={params.count}
                    onChange={e => setParams({...params, count: parseInt(e.target.value)})}
                    className="w-12 bg-black border border-white/10 rounded-lg p-1 text-center text-xs font-bold text-white"
                   />
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={params.isSequential} onChange={e => setParams({...params, isSequential: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-pink-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <h4 className="font-bold text-white text-sm">{t.all_angles}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">View from multiple perspectives</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={params.allAngles} onChange={e => setParams({...params, allAngles: e.target.checked})} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-black/40 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold uppercase tracking-widest text-xs text-slate-400 transition-all">{t.cancel}</button>
          <button 
            onClick={() => onConfirm(params)}
            className="flex-[2] py-4 bg-pink-600 hover:bg-pink-500 rounded-2xl font-bold uppercase tracking-widest text-xs text-white transition-all shadow-xl shadow-pink-900/40"
          >
            {t.start_generation}
          </button>
        </div>
      </div>
    </div>
  );
};
