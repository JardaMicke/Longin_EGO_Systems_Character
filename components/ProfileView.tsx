
import React, { useState } from 'react';
import { Character, AppLanguage, AppSettings, ImageGenerationParams } from '../types';
import { translations } from '../locales';
import { generateImage } from '../llmService';

interface ProfileViewProps {
  character: Character;
  language: AppLanguage;
  settings: AppSettings;
  onClose: () => void;
  onStartChat: (id: string) => void;
  onUpdateCharacter?: (char: Character) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ character, language, settings, onClose, onStartChat, onUpdateCharacter }) => {
  const profile = character.profile;
  const t = translations[language];
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const images = profile?.gallery || [];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex(prev => prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex(prev => prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null);
  };

  const handleGenerateGallery = async () => {
    if(!onUpdateCharacter) return;
    setIsGenerating(true);
    try {
      const newImages: string[] = [];
      const poses = [
        "A full body shot showing their usual posture and outfit in natural lighting.",
        "A dynamic mid-shot looking confident or relaxed in their typical setting.",
        "A close-up portrait showcasing their facial features and expression.",
        "A candid moment, looking away from the camera, immersed in their thoughts."
      ];

      // Since generateImage uses the provided ImageGenerationParams, we can just call it in parallel or sequential
      for (const pose of poses) {
        const params: ImageGenerationParams = {
          aspectRatio: '3:4',
          quality: '1K',
          style: 'Photorealistic',
          pose: pose,
          expression: character.mood === 'happy' ? 'Happy' : 'Serious',
          dressType: 'Casual',
          props: [],
          tags: [],
          isSequential: false,
          count: 1,
          allAngles: false
        };
        const res = await generateImage(character, params, settings);
        if (res && res.length > 0) {
           newImages.push(...res);
        }
      }

      if (newImages.length > 0) {
        const updatedChar = { ...character };
        if(!updatedChar.profile) {
          // Keep other properties
        }
        updatedChar.profile = { 
          ...character.profile,
          gallery: [...(updatedChar.profile?.gallery || []), ...newImages] 
        };
        onUpdateCharacter(updatedChar);
      }
    } catch(e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in zoom-in duration-300 select-none group"
          onClick={() => setSelectedImageIndex(null)}
        >
          <img 
            src={images[selectedImageIndex] || undefined} 
            alt={`Full size ${selectedImageIndex + 1}`} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-pink-500/20"
          />
          
          <button 
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {images.length > 1 && (
            <>
              <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-widest z-50">
                {selectedImageIndex + 1} / {images.length}
              </div>
              
              <button 
                onClick={handlePrev}
                className="absolute left-6 md:left-12 p-4 bg-white/5 hover:bg-white/20 hover:scale-110 rounded-full text-white transition-all z-50 focus:outline-none"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <button 
                onClick={handleNext}
                className="absolute right-6 md:right-12 p-4 bg-white/5 hover:bg-white/20 hover:scale-110 rounded-full text-white transition-all z-50 focus:outline-none"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-[#0c0c0e] w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(219,39,119,0.1)] overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white md:hidden">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left: Main Image */}
        <div className="w-full md:w-[40%] h-64 md:h-full relative overflow-hidden group flex-shrink-0">
          <img 
            src={character.avatar || undefined} 
            alt={character.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="absolute bottom-8 left-8">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{character.name}</h2>
            <p className="text-pink-500 font-bold uppercase tracking-widest text-xs mt-1">{profile?.occupation || character.description}</p>
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-12">
          <div className="flex justify-between items-start">
            <div className="hidden md:block">
              <h3 className="text-2xl font-bold text-white tracking-tight">{t.profile_companion}</h3>
              <p className="text-slate-500 text-sm font-medium">{t.personal_data}</p>
            </div>
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t.age, value: profile?.age || '20+' },
              { label: t.height, value: profile?.height || '170 cm' },
              { label: t.weight, value: profile?.weight || '55 kg' },
              { label: t.type, value: character.tags[0] || 'Unikátní' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Personality & Quirks */}
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-black text-pink-500 tracking-[0.2em]">{t.personality}</h4>
              <p className="text-slate-300 leading-relaxed text-lg italic font-medium">"{character.personality}"</p>
            </div>
            {character.personalityQuirks && character.personalityQuirks.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-black text-violet-500 tracking-[0.2em]">{t.quirks}</h4>
                <div className="flex flex-wrap gap-2">
                  {character.personalityQuirks.map((q, i) => (
                    <span key={i} className="px-4 py-2 bg-violet-500/10 text-violet-400 rounded-full text-xs font-bold border border-violet-500/10 tracking-wide uppercase">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Backstory (Rich Text) */}
          {character.backstory && (
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-black text-slate-500 tracking-[0.2em]">{t.backstory}</h4>
              <div 
                className="text-slate-400 leading-relaxed text-md font-medium backstory-content border-l-2 border-pink-500/20 pl-6 py-2"
                dangerouslySetInnerHTML={{ __html: character.backstory }}
              />
            </div>
          )}

          {/* Hobbies & Tags */}
          <div className="grid md:grid-cols-2 gap-12">
            {profile?.hobbies && profile.hobbies.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-black text-slate-500 tracking-[0.2em]">{t.hobbies}</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((h, i) => (
                    <span key={i} className="px-4 py-2 bg-white/5 rounded-full text-xs font-bold text-slate-300 border border-white/5 tracking-wide uppercase">{h}</span>
                  ))}
                </div>
              </div>
            )}
            {profile?.likes && profile.likes.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-black text-slate-500 tracking-[0.2em]">{t.likes}</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.likes.map((l, i) => (
                    <span key={i} className="px-4 py-2 bg-pink-500/10 text-pink-400 rounded-full text-xs font-bold border border-pink-500/10 tracking-wide uppercase">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs uppercase font-black text-slate-500 tracking-[0.2em]">{t.gallery}</h4>
              <button 
                onClick={handleGenerateGallery}
                disabled={isGenerating}
                className="text-xs px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>+ Generate Samples</>
                )}
              </button>
            </div>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <div 
                    key={i} 
                    className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 shadow-lg group cursor-zoom-in"
                    onClick={() => setSelectedImageIndex(i)}
                  >
                    <img src={img || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`gallery-${i}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium">No images in gallery yet.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-8 flex gap-4 sticky bottom-0 bg-[#0c0c0e]/80 backdrop-blur-md pb-4">
            <button 
              onClick={() => {
                onStartChat(character.id);
                onClose();
              }}
              className="flex-1 bg-pink-600 hover:bg-pink-500 py-5 rounded-[1.5rem] font-bold uppercase tracking-widest text-sm transition-all shadow-[0_10px_30px_rgba(219,39,119,0.3)] text-white hover:scale-[1.02] active:scale-95"
            >
              {t.start_conversation}
            </button>
            <button className="px-8 bg-white/5 hover:bg-white/10 rounded-[1.5rem] text-slate-300 border border-white/5 transition-all hover:scale-[1.02] active:scale-95">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
