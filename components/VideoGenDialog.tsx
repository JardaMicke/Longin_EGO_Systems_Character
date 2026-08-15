
import React, { useState, useMemo } from 'react';
import { VideoGenerationParams, VideoTemplate, AppLanguage } from '../types';
import { translations } from '../locales';

interface VideoGenDialogProps {
  onConfirm: (params: VideoGenerationParams) => void;
  onClose: () => void;
  language: AppLanguage;
  initialPrompt?: string;
}

export const VideoGenDialog: React.FC<VideoGenDialogProps> = ({ onConfirm, onClose, language, initialPrompt = "" }) => {
  const t = translations[language];
  
  const templates: VideoTemplate[] = useMemo(() => [
    { 
      id: 'tiktok', 
      name: t.template_tiktok, 
      description: t.template_tiktok_desc, 
      aspectRatio: '9:16', 
      resolution: '720p',
      icon: '📱',
      category: 'social'
    },
    { 
      id: 'vlog', 
      name: t.template_vlog, 
      description: t.template_vlog_desc, 
      aspectRatio: '9:16', 
      resolution: '1080p',
      icon: '🤳',
      category: 'social'
    },
    { 
      id: 'portrait', 
      name: t.template_portrait, 
      description: t.template_portrait_desc, 
      aspectRatio: '9:16', 
      resolution: '1080p',
      icon: '✨',
      category: 'social'
    },
    { 
      id: 'cinematic', 
      name: t.template_cinematic, 
      description: t.template_cinematic_desc, 
      aspectRatio: '16:9', 
      resolution: '1080p',
      icon: '🎬',
      category: 'cinematic'
    },
    { 
      id: 'action', 
      name: t.template_action, 
      description: t.template_action_desc, 
      aspectRatio: '16:9', 
      resolution: '720p',
      icon: '🔥',
      category: 'cinematic'
    },
    { 
      id: 'slowmo', 
      name: t.template_slowmo, 
      description: t.template_slowmo_desc, 
      aspectRatio: '16:9', 
      resolution: '1080p',
      icon: '🧊',
      category: 'cinematic'
    },
    { 
      id: 'dream', 
      name: t.template_dream, 
      description: t.template_dream_desc, 
      aspectRatio: '16:9', 
      resolution: '720p',
      icon: '☁️',
      category: 'experimental'
    },
    { 
      id: 'cctv', 
      name: t.template_cctv, 
      description: t.template_cctv_desc, 
      aspectRatio: '16:9', 
      resolution: '720p',
      icon: '📹',
      category: 'experimental'
    },
    { 
      id: 'vintage', 
      name: t.template_vintage, 
      description: t.template_vintage_desc, 
      aspectRatio: '16:9', 
      resolution: '1080p',
      icon: '🎞️',
      category: 'experimental'
    },
  ], [t]);

  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate>(templates[0]);
  const [activeCategory, setActiveCategory] = useState<'social' | 'cinematic' | 'experimental'>('social');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [useConsistentCharacter, setUseConsistentCharacter] = useState(false);
  const [photorealisticBoost, setPhotorealisticBoost] = useState(false);

  const filteredTemplates = useMemo(() => 
    templates.filter(tmpl => tmpl.category === activeCategory),
    [templates, activeCategory]
  );

  const handleConfirm = () => {
    // Inject stylistic cues based on template
    let finalPrompt = prompt;
    if (selectedTemplate.id === 'vlog') finalPrompt += ", handheld camera, shaky cam, talking to camera, vlog style";
    if (selectedTemplate.id === 'slowmo') finalPrompt += ", high frame rate, cinematic slow motion, extreme detail";
    if (selectedTemplate.id === 'dream') finalPrompt += ", surreal, ethereal lighting, soft focus, dreamlike atmosphere";
    if (selectedTemplate.id === 'cctv') finalPrompt += ", security camera footage, high angle, surveillance style, grainy, green tint";
    if (selectedTemplate.id === 'vintage') finalPrompt += ", 8mm film, film grain, scratches, vintage 1970s aesthetic";

    onConfirm({
      prompt: finalPrompt,
      aspectRatio: selectedTemplate.aspectRatio,
      resolution: selectedTemplate.resolution,
      segments: 1,
    useConsistentCharacter: true,
    photorealisticBoost: true
    });
  };

  const categories = [
    { id: 'social', name: t.cat_social, icon: '🌟' },
    { id: 'cinematic', name: t.cat_cinematic, icon: '🎥' },
    { id: 'experimental', name: t.cat_experimental, icon: '🧪' },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0c0c0e] w-full max-w-3xl rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.15)] flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <span className="bg-violet-600/20 p-2 rounded-xl text-violet-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </span>
              {t.generate_story}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Powered by VEO 3.1 Neural Engine</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-slate-500 transition-all hover:rotate-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Workflows / Presets */}
          <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-violet-500/20 mb-4">
            <label className="text-[10px] font-black uppercase text-violet-400 tracking-[0.2em] mb-4 block flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              Director's Flows (Consistent Characters)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setUseConsistentCharacter(true); setPhotorealisticBoost(true); }}
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${photorealisticBoost && useConsistentCharacter ? 'bg-violet-600/20 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-black/40 border-white/5 hover:border-violet-500/50'}`}
              >
                <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center mb-2 text-violet-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-white mb-1">Photorealistic Consistent Subject</span>
                <span className="text-[9px] text-slate-400">Enforces FaceID into video generation</span>
              </button>

              <button
                onClick={() => { setUseConsistentCharacter(false); setPhotorealisticBoost(false); }}
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${!photorealisticBoost && !useConsistentCharacter ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-black/40 border-white/5 hover:border-indigo-500/50'}`}
              >
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mb-2 text-indigo-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-white mb-1">Standard Scene (Open World)</span>
                <span className="text-[9px] text-slate-400">Allows general scenery without face locking</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const firstOfCat = templates.find(t => t.category === cat.id);
                  if (firstOfCat) setSelectedTemplate(firstOfCat);
                }}
                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeCategory === cat.id ? 'bg-violet-600 text-white shadow-xl shadow-violet-900/40' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-violet-500 tracking-[0.2em] mb-5 block">{t.video_templates}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`flex items-start gap-5 p-5 rounded-3xl border transition-all text-left group relative overflow-hidden ${
                    selectedTemplate.id === tmpl.id 
                    ? 'bg-violet-600/10 border-violet-500 shadow-2xl shadow-violet-900/10' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`text-3xl transition-transform duration-500 ${selectedTemplate.id === tmpl.id ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>
                    {tmpl.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-black text-xs uppercase tracking-wider ${selectedTemplate.id === tmpl.id ? 'text-violet-400' : 'text-white'}`}>
                      {tmpl.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-medium">
                      {tmpl.description}
                    </p>
                    <div className="flex gap-2 mt-4">
                       <span className="text-[8px] font-black bg-black/60 px-2 py-1 rounded-lg text-slate-400 border border-white/5 uppercase tracking-tighter">{tmpl.aspectRatio}</span>
                       <span className="text-[8px] font-black bg-black/60 px-2 py-1 rounded-lg text-slate-400 border border-white/5 uppercase tracking-tighter">{tmpl.resolution}</span>
                    </div>
                  </div>
                  {selectedTemplate.id === tmpl.id && (
                    <div className="absolute top-2 right-2 text-violet-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{t.video_prompt_label}</label>
               <span className="text-[9px] text-violet-500/50 font-black uppercase tracking-widest italic">{selectedTemplate.name} Context Active</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-black/50 border border-white/10 rounded-[1.5rem] p-6 text-white focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 outline-none resize-none text-base font-semibold transition-all placeholder:text-slate-800 shadow-inner"
              placeholder="Describe the scene in detail..."
            />
          </div>
        </div>

        <div className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-xl flex gap-5">
          <button onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 transition-all border border-white/5">{t.cancel}</button>
          <button 
            onClick={handleConfirm}
            className="flex-[2] py-5 bg-violet-600 hover:bg-violet-500 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] text-white transition-all shadow-2xl shadow-violet-900/50 hover:scale-[1.02] active:scale-95"
          >
            {t.start_generation}
          </button>
        </div>
      </div>
    </div>
  );
};
