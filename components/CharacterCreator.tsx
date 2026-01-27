
import React, { useState, useEffect, useRef } from 'react';
import { Character, BodySpecs, FaceSpecs, AppLanguage } from '../types';
import { translations } from '../locales';
import { refineSystemPrompt } from '../llmService';
import { db } from '../db';

interface CreatorProps {
  onSave: (char: Character) => void;
  onClose: () => void;
  language: AppLanguage;
}

interface ExtendedBodySpecs extends BodySpecs {
  armThickness: number;
  bellySize: number;
  neckLength: number;
  calfSize: number;
}

interface ExtendedFaceSpecs extends FaceSpecs {
  eyeTilt: number;
  mouthWidth: number;
  earSize: number;
}

export const CharacterCreator: React.FC<CreatorProps> = ({ onSave, onClose, language }) => {
  const t = translations[language];
  const settings = db.getSettings();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [greeting, setGreeting] = useState('');
  const [visualTraits, setVisualTraits] = useState('');
  const [backstory, setBackstory] = useState('');
  const [quirksInput, setQuirksInput] = useState('');
  const [quirks, setQuirks] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Custom']);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSystemPromptDirty, setIsSystemPromptDirty] = useState(false);
  const [hoveredSpec, setHoveredSpec] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  
  // Sampling Parameters
  const [temperature, setTemperature] = useState(1.0);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(40);

  const [avatar, setAvatar] = useState(`https://picsum.photos/seed/${Math.random()}/400/600`);
  
  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'body' | 'face' | 'advanced'>('basic');

  const [body, setBody] = useState<ExtendedBodySpecs>({
    height: 165,
    shoulders: 40,
    chest: 50,
    waist: 30,
    hips: 50,
    legs: 40,
    muscleTone: 20,
    armThickness: 30,
    bellySize: 10,
    neckLength: 40,
    calfSize: 30
  });

  const [face, setFace] = useState<ExtendedFaceSpecs>({
    roundness: 50,
    eyeSize: 50,
    noseShape: 50,
    lipsSize: 50,
    jawline: 50,
    forehead: 50,
    eyeTilt: 50,
    mouthWidth: 50,
    earSize: 50
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate system prompt if it hasn't been manually edited
  useEffect(() => {
    if (!isSystemPromptDirty) {
      const generated = `You are ${name || 'an AI companion'}. Personality: ${personality || 'friendly and supportive'}. Quirks: ${quirks.join(', ')}. Backstory: ${backstory || 'N/A'}. Role: ${description || 'companion'}. Always act as a high-end AI companion.`;
      setSystemPrompt(generated);
    }
  }, [name, personality, quirks, backstory, description, isSystemPromptDirty]);

  const handleRefinePrompt = async () => {
    setIsRefining(true);
    const refined = await refineSystemPrompt({
      name, description, personality, personalityQuirks: quirks, backstory, visualTraits
    }, settings);
    if (refined) {
      setSystemPrompt(refined);
      setIsSystemPromptDirty(true);
    }
    setIsRefining(false);
  };

  const addQuirk = () => {
    if (quirksInput.trim()) {
      setQuirks([...quirks, quirksInput.trim()]);
      setQuirksInput('');
    }
  };

  const removeQuirk = (index: number) => {
    setQuirks(quirks.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagsInput.trim() && !tags.includes(tagsInput.trim())) {
      setTags([...tags, tagsInput.trim()]);
      setTagsInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setBackstory(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        handleCommand('insertImage', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bodyPrompt = `Body: ${body.height}cm tall, muscleTone:${body.muscleTone}%, shoulders:${body.shoulders}, chest:${body.chest}, waist:${body.waist}, hips:${body.hips}, legs:${body.legs}, armThickness:${body.armThickness}, belly:${body.bellySize}, neck:${body.neckLength}.`;
    const facePrompt = `Face: roundness:${face.roundness}, eyes:${face.eyeSize}, eyeTilt:${face.eyeTilt}, nose:${face.noseShape}, lips:${face.lipsSize}, mouthWidth:${face.mouthWidth}, jaw:${face.jawline}, forehead:${face.forehead}.`;
    
    const newChar: Character = {
      id: Date.now().toString(),
      name,
      avatar,
      description,
      personality,
      greeting,
      visualTraits: `${visualTraits}. ${bodyPrompt} ${facePrompt}`,
      backstory: backstory,
      personalityQuirks: quirks,
      bodySpecs: body,
      faceSpecs: face,
      tags: tags,
      systemPrompt: systemPrompt || `You are ${name}. Personality: ${personality}. Quirks: ${quirks.join(', ')}. Backstory: ${backstory}. Role: ${description}. Visual Traits: ${visualTraits}. ${bodyPrompt} ${facePrompt}. Always act as a high-end AI companion.`,
      temperature,
      topK,
      topP
    };
    onSave(newChar);
  };

  const muscleStyle = {
    boxShadow: body.muscleTone > 50 
      ? `inset 0 0 15px rgba(255, 255, 255, ${ (body.muscleTone - 50) / 70 }), 
         inset 0 0 5px rgba(0,0,0, ${body.muscleTone / 100})` 
      : `inset 0 0 5px rgba(0,0,0, ${body.muscleTone / 200})`,
    borderColor: body.muscleTone > 70 ? 'rgba(219, 39, 119, 0.4)' : 'rgba(255,255,255,0.05)'
  };

  const MeasurementLabel = ({ value, label, side = 'right' }: { value: any, label: string, side?: 'left' | 'right' }) => (
    <div className={`absolute ${side === 'right' ? 'left-full ml-4' : 'right-full mr-4'} whitespace-nowrap flex items-center gap-2 pointer-events-none transition-all duration-300 ${hoveredSpec === label ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
      <div className={`h-[1px] w-8 bg-pink-500/50`}></div>
      <span className="text-[10px] font-black text-pink-500 bg-black/90 px-2.5 py-1.5 rounded-lg border border-pink-500/30 shadow-2xl backdrop-blur-md">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="bg-[#0c0c0e] w-full max-w-6xl rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(219,39,119,0.1)] overflow-hidden flex flex-col md:flex-row h-full max-h-[95vh]">
        
        {/* Left: Ragdoll & Visual Preview */}
        <div className="w-full md:w-96 bg-[#050505] flex flex-col items-center p-8 border-b md:border-b-0 md:border-r border-white/5 space-y-8 overflow-y-auto relative custom-scrollbar">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500 z-10">{t.morph_preview}</h3>
          
          {/* Ruler Background */}
          <div className="absolute inset-y-16 left-8 w-px bg-white/5 flex flex-col justify-between items-center py-20 pointer-events-none z-0">
             {[200, 180, 160, 140].map(h => (
               <div key={h} className="relative flex items-center">
                 <div className="w-2 h-px bg-white/20 -ml-1"></div>
                 <span className="text-[8px] font-bold text-slate-700 absolute left-4">{h}cm</span>
               </div>
             ))}
          </div>

          <div className="relative w-72 h-[550px] flex items-center justify-center transition-all duration-700 ease-out" style={{ transform: `scale(${0.75 + (body.height - 140) / 240})` }}>
            <div className="relative w-full h-full flex flex-col items-center">
              
              {/* Head Section */}
              <div 
                className="bg-slate-800 rounded-full border border-slate-700 transition-all duration-500 flex flex-col items-center justify-center relative z-50 shadow-2xl"
                style={{ 
                  width: `${36 + (face.roundness / 6)}px`, 
                  height: `${42 + (face.forehead / 7)}px`,
                  borderRadius: `${40 + face.roundness/4}% ${40 + face.roundness/4}% 45% 45%`,
                  background: `radial-gradient(circle at 35% 30%, #475569, #1e293b)`
                }}
              >
                <MeasurementLabel value={`${face.roundness}%`} label="roundness" side="left" />
                
                {/* Face Features */}
                <div className="flex gap-4 -mt-1">
                  <div className="w-2.5 h-1.5 bg-pink-500/60 rounded-full shadow-[0_0_8px_rgba(219,39,119,0.5)] transition-all duration-300" style={{ transform: `rotate(${face.eyeTilt - 50}deg) scale(${0.8 + face.eyeSize/100})` }}></div>
                  <div className="w-2.5 h-1.5 bg-pink-500/60 rounded-full shadow-[0_0_8px_rgba(219,39,119,0.5)] transition-all duration-300" style={{ transform: `rotate(${-(face.eyeTilt - 50)}deg) scale(${0.8 + face.eyeSize/100})` }}></div>
                </div>
                {/* Nose hint */}
                <div className="w-1 h-3 bg-black/15 rounded-full mt-1.5 transition-all duration-300" style={{ transform: `scaleY(${0.5 + face.noseShape/100})` }}></div>
                {/* Mouth */}
                <div className="w-4 h-0.5 bg-pink-500/20 rounded-full mt-2 transition-all duration-300" style={{ width: `${8 + face.mouthWidth/6}px`, height: `${1 + face.lipsSize/35}px`, background: face.lipsSize > 70 ? 'rgba(219,39,119,0.5)' : 'rgba(219,39,119,0.2)' }}></div>
                
                {/* Ears */}
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-4 bg-slate-700 rounded-full border border-black/10 transition-all duration-300" style={{ height: `${5 + face.earSize/12}px`, width: `${2.5 + face.earSize/40}px` }}></div>
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-4 bg-slate-700 rounded-full border border-black/10 transition-all duration-300" style={{ height: `${5 + face.earSize/12}px`, width: `${2.5 + face.earSize/40}px` }}></div>
              </div>

              {/* Neck */}
              <div 
                className="bg-slate-900 -mt-2 relative z-40 transition-all duration-500 border-x border-black/30" 
                style={{ 
                  height: `${14 + (body.neckLength / 6)}px`, 
                  width: `${14 + body.muscleTone/22}px`,
                  background: 'linear-gradient(to bottom, #1e293b, #0f172a)'
                }}
              >
                <MeasurementLabel value={`${body.neckLength}`} label="neckLength" side="right" />
              </div>

              {/* Torso & Limbs Group */}
              <div className="flex flex-col items-center relative z-30">
                
                {/* Shoulders block */}
                <div 
                  className="bg-slate-700 h-10 rounded-full -mt-2 transition-all duration-500 relative z-40 flex items-center justify-between px-1 border-t border-white/10 shadow-lg"
                  style={{ 
                    width: `${75 + (body.shoulders / 1.1)}px`,
                    background: `linear-gradient(to bottom, #475569, #334155)`,
                    ...muscleStyle
                  }}
                >
                  <MeasurementLabel value={`${body.shoulders}`} label="shoulders" side="left" />
                  <div className="w-7 h-7 rounded-full bg-slate-600/60 border border-white/5 shadow-inner"></div>
                  <div className="w-7 h-7 rounded-full bg-slate-600/60 border border-white/5 shadow-inner"></div>
                </div>

                {/* Arms Visualizer */}
                <div className="absolute flex justify-between w-full pointer-events-none" style={{ width: `${88 + (body.shoulders / 1.1)}px` }}>
                  {/* Left Arm */}
                  <div className="flex flex-col items-center -mt-2 transition-all duration-700 group/arm">
                    <div className="bg-slate-800 rounded-full transition-all duration-500 border border-white/5 shadow-2xl" style={{ width: `${14 + body.armThickness/6}px`, height: '90px', ...muscleStyle }}></div>
                    <div className="w-4.5 h-4.5 bg-slate-700 rounded-full -mt-3.5 border border-black/30 z-10 shadow-sm"></div>
                    <div className="bg-slate-800 rounded-full transition-all duration-500 border border-white/5" style={{ width: `${11 + body.armThickness/8}px`, height: '80px', borderRadius: '50% 50% 40% 40%' }}></div>
                  </div>
                  {/* Right Arm */}
                  <div className="flex flex-col items-center -mt-2 transition-all duration-700 group/arm">
                    <div className="bg-slate-800 rounded-full transition-all duration-500 border border-white/5 shadow-2xl" style={{ width: `${14 + body.armThickness/6}px`, height: '90px', ...muscleStyle }}></div>
                    <div className="w-4.5 h-4.5 bg-slate-700 rounded-full -mt-3.5 border border-black/30 z-10 shadow-sm"></div>
                    <div className="bg-slate-800 rounded-full transition-all duration-500 border border-white/5" style={{ width: `${11 + body.armThickness/8}px`, height: '80px', borderRadius: '50% 50% 40% 40%' }}></div>
                  </div>
                </div>

                {/* Chest / Pectorals */}
                <div 
                  className="bg-slate-600 h-30 rounded-b-[48%] transition-all duration-500 -mt-5 relative z-30 border border-white/5 flex flex-col items-center overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
                  style={{ 
                    width: `${64 + (body.chest / 2.2)}px`,
                    background: `linear-gradient(to bottom, #475569, #2d3748)`,
                    ...muscleStyle
                  }}
                >
                   <MeasurementLabel value={`${body.chest}`} label="chest" side="right" />
                   <div className="flex gap-8 mt-10 opacity-40">
                      <div className="w-11 h-11 rounded-full border-t-2 border-white/30 shadow-[0_-8px_15px_rgba(255,255,255,0.1)]"></div>
                      <div className="w-11 h-11 rounded-full border-t-2 border-white/30 shadow-[0_-8px_15px_rgba(255,255,255,0.1)]"></div>
                   </div>
                   {/* Muscle Separation */}
                   {body.muscleTone > 45 && <div className="mt-6 w-0.5 h-12 bg-black/20 rounded-full"></div>}
                </div>

                {/* Midsection & Belly */}
                <div 
                  className="bg-slate-800 h-22 transition-all duration-500 flex flex-col items-center relative z-20 -mt-2 border-x border-black/30"
                  style={{ 
                    width: `${48 + (body.waist / 1.4)}px`,
                    background: 'linear-gradient(to bottom, #2d3748, #1a202c)',
                    ...muscleStyle
                  }}
                >
                  <MeasurementLabel value={`${body.waist}`} label="waist" side="left" />
                  <div className="relative mt-5 flex flex-col items-center">
                    {/* Belly Button */}
                    <div className="w-2 h-2 bg-pink-500/25 rounded-full shadow-[0_0_8px_rgba(219,39,119,0.2)]"></div>
                    {/* Anatomical Belly Expansion */}
                    <div 
                      className="bg-pink-500/10 rounded-full transition-all duration-500 blur-xl absolute -bottom-4" 
                      style={{ 
                        width: `${30 + body.bellySize/1.2}px`, 
                        height: `${20 + body.bellySize/2}px`,
                        opacity: body.bellySize / 90
                      }}
                    ></div>
                    {/* Abs Definition */}
                    {body.muscleTone > 60 && (
                      <div className="grid grid-cols-2 gap-1.5 mt-3 opacity-30">
                        <div className="w-5 h-1.5 bg-white/60 rounded-full"></div>
                        <div className="w-5 h-1.5 bg-white/60 rounded-full"></div>
                        <div className="w-5 h-1.5 bg-white/60 rounded-full"></div>
                        <div className="w-5 h-1.5 bg-white/60 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pelvis & Hips */}
                <div 
                  className="bg-slate-700 h-24 rounded-t-[42%] transition-all duration-500 -mt-2 relative z-30 border border-white/5 shadow-2xl"
                  style={{ 
                    width: `${58 + (body.hips / 1.6)}px`,
                    borderRadius: `${38 + body.hips/6}% ${38 + body.hips/6}% 22% 22%`,
                    background: `linear-gradient(to top, #4a5568, #2d3748)`,
                    ...muscleStyle
                  }}
                >
                   <MeasurementLabel value={`${body.hips}`} label="hips" side="right" />
                </div>

                {/* Lower Extremities */}
                <div className="flex gap-4 -mt-2 relative z-10 transition-all duration-700 ease-in-out">
                  {/* Left Leg */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="bg-slate-800 rounded-b-2xl transition-all duration-500 border-x border-b border-white/5 shadow-xl" 
                      style={{ 
                        width: `${22 + (body.legs / 4.5)}px`, 
                        height: `${125 + (body.height - 160) * 0.6}px`, 
                        borderRadius: '0 0 2rem 2rem',
                        ...muscleStyle 
                      }}
                    >
                      <MeasurementLabel value={`${body.legs}`} label="legs" side="left" />
                    </div>
                    <div className="w-5.5 h-5.5 bg-slate-700 rounded-full -mt-3 shadow-inner border border-black/30 z-20"></div>
                    <div 
                      className="bg-slate-800 rounded-b-3xl transition-all duration-500 border-x border-b border-white/5 shadow-md" 
                      style={{ width: `${15 + (body.calfSize / 6)}px`, height: `${95 + (body.height - 160) * 0.5}px` }}
                    >
                      <MeasurementLabel value={`${body.calfSize}`} label="calfSize" side="left" />
                    </div>
                    {/* Foot */}
                    <div className="w-12 h-4 bg-slate-900 rounded-full -mt-1 skew-x-[-12deg] shadow-lg"></div>
                  </div>
                  {/* Right Leg */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="bg-slate-800 rounded-b-2xl transition-all duration-500 border-x border-b border-white/5 shadow-xl" 
                      style={{ 
                        width: `${22 + (body.legs / 4.5)}px`, 
                        height: `${125 + (body.height - 160) * 0.6}px`, 
                        borderRadius: '0 0 2rem 2rem',
                        ...muscleStyle 
                      }}
                    ></div>
                    <div className="w-5.5 h-5.5 bg-slate-700 rounded-full -mt-3 shadow-inner border border-black/30 z-20"></div>
                    <div 
                      className="bg-slate-800 rounded-b-3xl transition-all duration-500 border-x border-b border-white/5 shadow-md" 
                      style={{ width: `${15 + (body.calfSize / 6)}px`, height: `${95 + (body.height - 160) * 0.5}px` }}
                    ></div>
                    {/* Foot */}
                    <div className="w-12 h-4 bg-slate-900 rounded-full -mt-1 skew-x-[12deg] shadow-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4 px-4 pb-4 z-10">
             <div className="relative group rounded-3xl overflow-hidden border-2 border-pink-500/20 shadow-2xl transition-all duration-500 hover:border-pink-500/40">
              <img src={avatar} alt="preview" className="w-full aspect-[3/4] object-cover transition-transform duration-1000 group-hover:scale-110" />
              <button 
                type="button" 
                onClick={() => setAvatar(`https://picsum.photos/seed/${Math.random()}/400/600`)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-sm"
              >
                {language === 'cs' ? 'Změnit vzhled' : 'Shuffle Appearance'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right: Detailed Configuration */}
        <div className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden">
          <div className="p-8 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md z-20">
            <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
              {(['basic', 'personality', 'body', 'face', 'advanced'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-2xl transition-all duration-300 ${activeTab === tab ? (tab === 'advanced' ? 'bg-violet-600 shadow-lg shadow-violet-900/40' : 'bg-pink-600 shadow-lg shadow-pink-900/40') + ' text-white scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  {tab === 'advanced' ? t.intelligence : t[tab as keyof typeof t]}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-all duration-300 hover:rotate-90 flex-shrink-0 ml-4 p-2 bg-white/5 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(219,39,119,0.03),transparent_40%)]">
            {activeTab === 'basic' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.name}</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="Např. Roxanne" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none text-white font-semibold transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.role}</label>
                    <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Např. Tajná agentka" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none text-white font-semibold transition-all" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.greeting}</label>
                  <input required value={greeting} onChange={e => setGreeting(e.target.value)} placeholder="Ahoj, konečně jsi tady..." className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none text-white font-semibold transition-all" />
                </div>
              </div>
            )}

            {activeTab === 'personality' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.personality_behavior}</label>
                  <textarea required rows={3} value={personality} onChange={e => setPersonality(e.target.value)} placeholder="Drzá, sebevědomá, občas stydlivá..." className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none text-white font-semibold resize-none transition-all leading-relaxed" />
                </div>

                <div className="space-y-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.quirks}</label>
                  <div className="flex gap-4">
                    <input value={quirksInput} onChange={e => setQuirksInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addQuirk())} placeholder={t.add_trait_placeholder} className="flex-1 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 focus:border-pink-500/50 focus:ring-0 outline-none text-white font-semibold transition-all" />
                    <button type="button" onClick={addQuirk} className="px-8 bg-white/10 hover:bg-white/20 rounded-[1.5rem] text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95">{t.add}</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {quirks.map((q, i) => (
                      <span key={i} className="px-5 py-2.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-pink-500/20 group">
                        {q} <button onClick={() => removeQuirk(i)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.backstory}</label>
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-white/20">
                    <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex flex-wrap gap-3 items-center">
                       <button type="button" onClick={() => handleCommand('bold')} className="p-2.5 hover:bg-pink-600/20 rounded-xl transition-all text-slate-400 hover:text-white font-black text-xs" title="Bold">B</button>
                       <button type="button" onClick={() => handleCommand('italic')} className="p-2.5 hover:bg-pink-600/20 rounded-xl transition-all text-slate-400 hover:text-white italic text-xs" title="Italic">I</button>
                       <div className="h-6 w-px bg-white/10 mx-1"></div>
                       <button type="button" onClick={() => handleCommand('insertUnorderedList')} className="p-2.5 hover:bg-pink-600/20 rounded-xl transition-all text-slate-400 hover:text-white" title="Bullet List">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                       </button>
                       <button type="button" onClick={() => handleCommand('formatBlock', '<blockquote>')} className="p-2.5 hover:bg-pink-600/20 rounded-xl transition-all text-slate-400 hover:text-white" title="Quote">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H14.017C13.4647 8 13.017 8.44772 13.017 9V15C13.017 16.1046 12.1216 17 11.017 17H10.017V21H14.017ZM1.017 21L1.017 18C1.017 16.8954 1.91241 16 3.017 16H6.017C6.56929 16 7.017 15.5523 7.017 15V9C7.017 8.44772 6.56929 8 6.017 8H1.017C0.464718 8 0.017 8.44772 0.017 9V15C0.017 16.1046 -0.878363 17 -1.98294 17H-2.98294V21H1.017Z" /></svg>
                       </button>
                       <div className="flex-1"></div>
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-violet-600/20 rounded-xl transition-all text-violet-400 hover:text-violet-300 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" title="Add Image">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Portrait
                       </button>
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                    <div 
                      ref={editorRef}
                      contentEditable 
                      onInput={(e) => setBackstory((e.target as HTMLDivElement).innerHTML)}
                      className="w-full min-h-[350px] bg-black/40 p-8 focus:outline-none text-slate-300 text-base leading-[1.8] backstory-content transition-all"
                      data-placeholder="Napište unikátní životní cestu postavy..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                  {[
                    { label: t.height, key: 'height', min: 140, max: 200, unit: 'cm' },
                    { label: language === 'cs' ? 'Šířka ramen' : 'Shoulders', key: 'shoulders', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Velikost hrudníku' : 'Chest', key: 'chest', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Obvod pasu' : 'Waist', key: 'waist', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Šířka boků' : 'Hips', key: 'hips', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Tloušťka stehen' : 'Legs', key: 'legs', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Svalová definice' : 'Muscle Tone', key: 'muscleTone', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Tloušťka paží' : 'Arm Thickness', key: 'armThickness', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Velikost bříška' : 'Belly Size', key: 'bellySize', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Délka krku' : 'Neck Length', key: 'neckLength', min: 0, max: 100, unit: '%' },
                    { label: language === 'cs' ? 'Velikost lýtek' : 'Calf Size', key: 'calfSize', min: 0, max: 100, unit: '%' }
                  ].map(spec => (
                    <div 
                      key={spec.key} 
                      className="space-y-4 group/slider"
                      onMouseEnter={() => setHoveredSpec(spec.key)}
                      onMouseLeave={() => setHoveredSpec(null)}
                    >
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] group-hover/slider:text-pink-500 transition-colors">{spec.label}</label>
                        <span className="text-xs font-black text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">{(body as any)[spec.key]}{spec.unit}</span>
                      </div>
                      <input type="range" min={spec.min} max={spec.max} value={(body as any)[spec.key]} onChange={e => setBody({...body, [spec.key]: parseInt(e.target.value)})} className="w-full h-2 bg-white/5 rounded-full appearance-none accent-pink-600 cursor-pointer transition-all hover:bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'face' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                  {[
                    { label: language === 'cs' ? 'Kulatost tváře' : 'Roundness', key: 'roundness' },
                    { label: language === 'cs' ? 'Velikost očí' : 'Eye Size', key: 'eyeSize' },
                    { label: language === 'cs' ? 'Sklon očí' : 'Eye Tilt', key: 'eyeTilt' },
                    { label: language === 'cs' ? 'Tvar nosu' : 'Nose Shape', key: 'noseShape' },
                    { label: language === 'cs' ? 'Plnost rtů' : 'Lips Size', key: 'lipsSize' },
                    { label: language === 'cs' ? 'Šířka úst' : 'Mouth Width', key: 'mouthWidth' },
                    { label: language === 'cs' ? 'Výraznost čelisti' : 'Jawline', key: 'jawline' },
                    { label: language === 'cs' ? 'Výška čela' : 'Forehead', key: 'forehead' },
                    { label: language === 'cs' ? 'Velikost uší' : 'Ear Size', key: 'earSize' }
                  ].map(spec => (
                    <div 
                      key={spec.key} 
                      className="space-y-4 group/slider"
                      onMouseEnter={() => setHoveredSpec(spec.key)}
                      onMouseLeave={() => setHoveredSpec(null)}
                    >
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] group-hover/slider:text-violet-500 transition-colors">{spec.label}</label>
                        <span className="text-xs font-black text-violet-500 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">{(face as any)[spec.key]}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={(face as any)[spec.key]} onChange={e => setFace({...face, [spec.key]: parseInt(e.target.value)})} className="w-full h-2 bg-white/5 rounded-full appearance-none accent-violet-600 cursor-pointer transition-all hover:bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-right-8 duration-500">
                {/* Cognitive Tuning Section */}
                <div className="space-y-8 bg-white/5 p-8 rounded-[2rem] border border-white/5 relative group/cognitive overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-[60px] rounded-full pointer-events-none transition-opacity opacity-0 group-hover/cognitive:opacity-100"></div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/20 shadow-inner">
                         <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      </div>
                      <h4 className="text-[12px] font-black uppercase text-white tracking-[0.2em]">{t.cognitive_tuning}</h4>
                    </div>
                    <button 
                      type="button"
                      disabled={isRefining}
                      onClick={handleRefinePrompt}
                      className="px-5 py-2.5 bg-violet-600/10 hover:bg-violet-600/30 border border-violet-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-violet-400 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isRefining ? (
                         <>
                           <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                           {t.prompt_refining}
                         </>
                      ) : t.enhance_prompt}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300/60 ml-1">{t.system_prompt}</label>
                    <textarea 
                      rows={8} 
                      value={systemPrompt} 
                      onChange={e => { setSystemPrompt(e.target.value); setIsSystemPromptDirty(true); }} 
                      placeholder="AI system instructions..." 
                      className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] p-6 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 outline-none text-slate-300 font-medium resize-none text-sm leading-relaxed transition-all shadow-inner" 
                    />
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300/60 ml-1 mb-6 block">{t.sampling_strategy}</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4 group/slider">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{t.temperature}</label>
                          <span className="text-xs font-black text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">{temperature.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.0" max="2.0" step="0.05" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-pink-600 cursor-pointer" />
                      </div>
                      <div className="space-y-4 group/slider">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{t.top_p}</label>
                          <span className="text-xs font-black text-violet-500 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">{topP.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.0" max="1.0" step="0.01" value={topP} onChange={e => setTopP(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-violet-600 cursor-pointer" />
                      </div>
                      <div className="space-y-4 group/slider">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{t.top_k}</label>
                          <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">{topK}</span>
                        </div>
                        <input type="range" min="1" max="100" step="1" value={topK} onChange={e => setTopK(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-indigo-600 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta Data Section */}
                <div className="space-y-8 bg-black/20 p-8 rounded-[2rem] border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-600/20 flex items-center justify-center border border-pink-500/20">
                         <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      </div>
                      <h4 className="text-[12px] font-black uppercase text-white tracking-[0.2em]">{t.meta_data}</h4>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.visual_traits}</label>
                      <textarea rows={2} value={visualTraits} onChange={e => setVisualTraits(e.target.value)} placeholder="Physical description for generation..." className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none text-slate-300 font-medium resize-none transition-all" />
                    </div>

                    <div className="space-y-5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.tags}</label>
                      <div className="flex gap-4">
                        <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder={t.add_tag} className="flex-1 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 focus:border-violet-500/50 focus:ring-0 outline-none text-slate-300 font-semibold transition-all" />
                        <button type="button" onClick={addTag} className="px-8 bg-white/10 hover:bg-white/20 rounded-[1.5rem] text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95">{t.add}</button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {tags.map((tag, i) => (
                          <span key={i} className="px-5 py-2.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-violet-500/20 group">
                            {tag} <button onClick={() => removeTag(i)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                </div>
              </div>
            )}
          </form>

          <div className="p-8 border-t border-white/5 bg-black/60 backdrop-blur-xl flex gap-6 z-20">
            <button type="button" onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 transition-all border border-white/5">{t.cancel}</button>
            <button onClick={handleSubmit} className="flex-[2] bg-pink-600 hover:bg-pink-500 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl shadow-pink-900/50 text-white hover:scale-[1.02] active:scale-95">
              {t.bring_to_life}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
