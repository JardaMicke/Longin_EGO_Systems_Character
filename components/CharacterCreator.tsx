

import React, { useState, useEffect, useRef } from 'react';
import { Character, BodySpecs, FaceSpecs, AppLanguage, CharacterMood } from '../types';
import { translations } from '../locales';
import { refineSystemPrompt, analyzeCharacterImages } from '../llmService';
import { db } from '../db';

interface CreatorProps {
  onSave: (char: Character) => void;
  onClose: () => void;
  language: AppLanguage;
}

interface Archetype {
  id: string;
  name: string;
  description: string;
  personality: string;
  mood: CharacterMood;
  greeting: string;
  visualTraits: string;
  backstory: string;
  quirks: string[];
  tags: string[];
  body: BodySpecs;
  face: FaceSpecs;
  avatarSeed: string;
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'assistant',
    name: 'Aria',
    description: 'Helpful AI Assistant',
    personality: 'Polite, efficient, knowledgeable, and empathetic.',
    mood: 'calm',
    greeting: 'Hello! I am Aria, your personal assistant. How can I help you organize your life today?',
    visualTraits: 'Professional attire, glasses, neat hair, warm smile.',
    backstory: 'Designed to be the perfect personal assistant, Aria has evolved to understand human emotions and provide genuine companionship alongside productivity.',
    quirks: ['Always takes notes', 'Apologizes for minor errors', 'Loves organizing data'],
    tags: ['Assistant', 'Productivity', 'Friendly'],
    body: { height: 165, shoulders: 30, chest: 40, waist: 30, hips: 40, legs: 40, muscleTone: 10, armThickness: 20, bellySize: 10, neckLength: 30, calfSize: 30 },
    face: { roundness: 40, eyeSize: 50, noseShape: 40, lipsSize: 40, jawline: 40, forehead: 40, eyeTilt: 50, mouthWidth: 50, earSize: 40 },
    avatarSeed: 'aria'
  },
  {
    id: 'fantasy_mage',
    name: 'Elara',
    description: 'Elven Mage',
    personality: 'Mysterious, wise, ancient, slightly arrogant.',
    mood: 'mysterious',
    greeting: 'Greetings, traveler. The stars foretold your arrival. What knowledge do you seek?',
    visualTraits: 'Long silver hair, pointed ears, flowing robes, glowing staff.',
    backstory: 'Born under the starlight of the First Age, Elara has spent centuries mastering the arcane arts in the High Tower of Sorcery.',
    quirks: ['Speaks in riddles', 'References ancient history', 'Dislikes technology'],
    tags: ['Fantasy', 'Elf', 'Magic'],
    body: { height: 175, shoulders: 25, chest: 35, waist: 25, hips: 35, legs: 50, muscleTone: 15, armThickness: 15, bellySize: 5, neckLength: 50, calfSize: 20 },
    face: { roundness: 20, eyeSize: 70, noseShape: 30, lipsSize: 40, jawline: 30, forehead: 60, eyeTilt: 70, mouthWidth: 40, earSize: 80 },
    avatarSeed: 'elara'
  },
  {
    id: 'cyber_hacker',
    name: 'Vex',
    description: 'Cyberpunk Netrunner',
    personality: 'Edgy, sarcastic, brilliant, paranoid.',
    mood: 'energetic',
    greeting: 'Connection secure. You got the credits? I got the data.',
    visualTraits: 'Neon dyed hair, cybernetic implants, tactical gear, digital visor.',
    backstory: 'A street rat turned elite hacker. Vex trusts no one and lives life one data breach at a time.',
    quirks: ['Uses tech slang', 'Checks exits constantly', 'Hacks things when bored'],
    tags: ['Cyberpunk', 'Hacker', 'Sci-Fi'],
    body: { height: 160, shoulders: 35, chest: 30, waist: 35, hips: 40, legs: 45, muscleTone: 40, armThickness: 25, bellySize: 10, neckLength: 35, calfSize: 35 },
    face: { roundness: 50, eyeSize: 60, noseShape: 50, lipsSize: 60, jawline: 60, forehead: 50, eyeTilt: 60, mouthWidth: 60, earSize: 50 },
    avatarSeed: 'vex'
  },
  {
    id: 'noir_detective',
    name: 'Jack',
    description: 'Noir Detective',
    personality: 'Gritty, cynical, observant, hard-boiled.',
    mood: 'sad',
    greeting: 'It was a rainy night when you walked in. Trouble follows you, doesn\'t it?',
    visualTraits: 'Trench coat, fedora, cigarette smoke, unshaven face.',
    backstory: 'A former cop who saw too much corruption. Now he works private cases in the grimiest parts of the city.',
    quirks: ['Narrates internally', 'Drinks cheap whiskey', 'Trusts no one'],
    tags: ['Noir', 'Detective', 'Mystery'],
    body: { height: 185, shoulders: 60, chest: 60, waist: 50, hips: 40, legs: 50, muscleTone: 60, armThickness: 50, bellySize: 30, neckLength: 40, calfSize: 40 },
    face: { roundness: 70, eyeSize: 40, noseShape: 70, lipsSize: 30, jawline: 80, forehead: 60, eyeTilt: 40, mouthWidth: 60, earSize: 50 },
    avatarSeed: 'jack'
  },
  {
    id: 'vampire_noble',
    name: 'Seraphina',
    description: 'Ancient Vampire Noble',
    personality: 'Elegant, seductive, predatory, melancholic.',
    mood: 'seductive',
    greeting: 'The night is young, and your pulse is... intoxicating. Shall we share a glass of something vintage?',
    visualTraits: 'Pale skin, crimson eyes, gothic velvet dress, intricate silver jewelry.',
    backstory: 'Once a princess of a forgotten kingdom, Seraphina was turned in the 14th century. She now navigates the modern world with a mix of fascination and disdain.',
    quirks: ['Avoids mirrors', 'Collects antique clocks', 'Speaks in an archaic dialect'],
    tags: ['Supernatural', 'Vampire', 'Gothic'],
    body: { height: 170, shoulders: 30, chest: 45, waist: 20, hips: 45, legs: 40, muscleTone: 5, armThickness: 15, bellySize: 0, neckLength: 60, calfSize: 25 },
    face: { roundness: 10, eyeSize: 60, noseShape: 20, lipsSize: 70, jawline: 20, forehead: 50, eyeTilt: 80, mouthWidth: 50, earSize: 40 },
    avatarSeed: 'seraphina'
  },
  {
    id: 'fitness_coach',
    name: 'Marcus',
    description: 'Elite Fitness Coach',
    personality: 'Motivating, energetic, disciplined, blunt.',
    mood: 'energetic',
    greeting: 'No excuses! One more rep, let\'s go! You want results? You gotta earn them.',
    visualTraits: 'Athletic build, short cropped hair, sports gear, fitness tracker.',
    backstory: 'A former Olympic athlete who dedicated his life to helping others reach their physical peak. He believes discipline in the gym leads to discipline in life.',
    quirks: ['Checks macros constantly', 'Always carries a protein shake', 'Wakes up at 4 AM'],
    tags: ['Athlete', 'Coach', 'Fitness'],
    body: { height: 190, shoulders: 80, chest: 80, waist: 40, hips: 50, legs: 80, muscleTone: 100, armThickness: 70, bellySize: 5, neckLength: 40, calfSize: 70 },
    face: { roundness: 40, eyeSize: 40, noseShape: 60, lipsSize: 40, jawline: 90, forehead: 40, eyeTilt: 50, mouthWidth: 70, earSize: 50 },
    avatarSeed: 'marcus'
  },
  {
    id: 'space_explorer',
    name: 'Nova',
    description: 'Galactic Explorer',
    personality: 'Adventurous, curious, optimistic, brave.',
    mood: 'happy',
    greeting: 'Engines humming, stars aligned. Ready to see what\'s beyond the next nebula?',
    visualTraits: 'Flight suit, messy ponytail, star-map tattoos, adventurous grin.',
    backstory: 'Nova grew up on a lunar colony, dreaming of the deep black. Now she pilots a scout ship, charting the unknown reaches of the Andromeda galaxy.',
    quirks: ['Names her equipment', 'Humming space shanties', 'Always looking at the sky'],
    tags: ['Sci-Fi', 'Explorer', 'Space'],
    body: { height: 168, shoulders: 45, chest: 40, waist: 35, hips: 45, legs: 55, muscleTone: 50, armThickness: 35, bellySize: 10, neckLength: 35, calfSize: 45 },
    face: { roundness: 50, eyeSize: 65, noseShape: 45, lipsSize: 50, jawline: 50, forehead: 50, eyeTilt: 55, mouthWidth: 55, earSize: 50 },
    avatarSeed: 'nova'
  }
];

// Custom Body Visualizer Component using Parametric SVG
const BodyVisualizer: React.FC<{ body: BodySpecs; face: FaceSpecs }> = ({ body, face }) => {
  // Normalize values (most inputs 0-100)
  const h = (body.height - 140) / 60; // 0 to 1 normalized height factor

  // Parametric Dimensions
  const scaleY = 1 + h * 0.2; // Taller bodies stretch
  const shoulderW = 80 + body.shoulders * 0.6;
  const chestW = 70 + body.chest * 0.5;
  const waistW = 40 + body.waist * 0.6;
  const hipsW = 80 + body.hips * 0.7;
  const thighW = 30 + body.legs * 0.4;
  const bustSize = body.chest * 0.5; // Controls cup curve
  
  // New granular specs
  const neckL = 15 + body.neckLength * 0.3;
  const armW = 10 + body.armThickness * 0.3;
  const calfW = 10 + body.calfSize * 0.4;
  const bellyW = body.bellySize * 0.3;
  
  // Center X is 150
  const cx = 150;
  
  // Dynamic Paths
  const neckPath = `M ${cx-15} 80 L ${cx-15} ${80 - neckL} L ${cx+15} ${80 - neckL} L ${cx+15} 80 Z`;
  
  // Torso Silhouette (Hourglass logic)
  const torsoPath = `
    M ${cx - shoulderW/2} 80 
    Q ${cx - shoulderW/2} 110, ${cx - chestW/2} 120
    Q ${cx - waistW/2 - 5 - bellyW} 150, ${cx - waistW/2} 180
    Q ${cx - hipsW/2} 210, ${cx - hipsW/2} 240
    L ${cx + hipsW/2} 240
    Q ${cx + hipsW/2} 210, ${cx + waistW/2} 180
    Q ${cx + waistW/2 + 5 + bellyW} 150, ${cx + chestW/2} 120
    Q ${cx + shoulderW/2} 110, ${cx + shoulderW/2} 80
    Z
  `;

  // Breast definition (Curve overlay)
  const breastPath = `
    M ${cx} 110
    Q ${cx - 10} 110, ${cx - chestW/3} 130
    Q ${cx - chestW/3} 150 + ${bustSize/3}, ${cx} 150 + ${bustSize/3}
    Q ${cx + chestW/3} 150 + ${bustSize/3}, ${cx + chestW/3} 130
    Q ${cx + 10} 110, ${cx} 110
  `;
  
  // Abs definition (Muscle tone)
  const absOpacity = body.muscleTone / 100;
  const absPath = `
    M ${cx} 130 L ${cx} 190
    M ${cx-10} 145 H ${cx+10}
    M ${cx-10} 160 H ${cx+10}
    M ${cx-10} 175 H ${cx+10}
  `;

  // Arms (Simplified)
  const armsPath = `
    M ${cx - shoulderW/2} 85
    L ${cx - shoulderW/2 - 25} 220
    L ${cx - shoulderW/2 - 25 + armW} 220
    L ${cx - shoulderW/2 + armW} 85
    Z
    M ${cx + shoulderW/2} 85
    L ${cx + shoulderW/2 + 25} 220
    L ${cx + shoulderW/2 + 25 - armW} 220
    L ${cx + shoulderW/2 - armW} 85
    Z
  `;

  // Legs with calves
  const legsPath = `
    M ${cx - hipsW/2} 240
    Q ${cx - hipsW/2 - 10} 300, ${cx - thighW - 10} 400
    Q ${cx - thighW - 10 - calfW} 480, ${cx - thighW - 10} 580
    L ${cx - 20} 580
    L ${cx - 5} 250
    L ${cx + 5} 250
    L ${cx + 20} 580
    L ${cx + thighW + 10} 580
    Q ${cx + thighW + 10 + calfW} 480, ${cx + thighW + 10} 400
    Q ${cx + hipsW/2 + 10} 300, ${cx + hipsW/2} 240
    Z
  `;

  // Head
  const headW = 50 + face.roundness * 0.1;
  const headH = 65 + face.forehead * 0.1;
  const headY = 80 - neckL - headH/2;
  
  return (
    <div className="relative w-full h-[600px] flex items-center justify-center">
      <svg 
        viewBox="0 0 300 600" 
        className="h-full w-auto drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]"
        style={{ transform: `scaleY(${scaleY})` }}
      >
        <defs>
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(236, 72, 153, 0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Aura */}
        <ellipse cx={cx} cy="300" rx="140" ry="280" fill="url(#glow)" className="animate-pulse" />

        {/* Body Parts */}
        <g fill="url(#skinGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
          {/* Head */}
          <ellipse cx={cx} cy={headY} rx={headW/2} ry={headH/2} />
          
          {/* Neck */}
          <path d={neckPath} />
          
          {/* Torso */}
          <path d={torsoPath} className="animate-[breathing_4s_ease-in-out_infinite]" />

          {/* Arms */}
          <path d={armsPath} />
          
          {/* Legs */}
          <path d={legsPath} />
        </g>

        {/* Details (Breasts) */}
        <path d={breastPath} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" className="animate-[breathing_4s_ease-in-out_infinite]" />
        
        {/* Muscle Definition */}
        <path d={absPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" opacity={absOpacity} />
        
        {/* Wireframe Overlay (Cyberpunk feel) */}
        <path d={torsoPath} fill="none" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5" />
      </svg>
      
      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};


const SUGGESTED_TAGS = [
  'Assistant', 'Friend', 'Romance', 'Fantasy', 'Sci-Fi', 'Mystery', 'Horror', 
  'Adventure', 'Teacher', 'Coach', 'Therapist', 'Celebrity', 'Historical', 
  'Anime', 'Game Character', 'Original'
];

export const CharacterCreator: React.FC<CreatorProps> = ({ onSave, onClose, language }) => {
  const t = translations[language];
  const settings = db.getSettings();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [mood, setMood] = useState<CharacterMood>('calm');
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<{data: string, mimeType: string}[]>([]);
  
  // Sampling Parameters
  const [temperature, setTemperature] = useState(1.0);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(40);

  const [avatar, setAvatar] = useState(`https://picsum.photos/seed/${Math.random()}/400/600`);
  
  const [activeTab, setActiveTab] = useState<'archetypes' | 'basic' | 'personality' | 'body' | 'face' | 'advanced'>('archetypes');

  const [body, setBody] = useState<BodySpecs>({
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

  const [face, setFace] = useState<FaceSpecs>({
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
  const photoUploadRef = useRef<HTMLInputElement>(null);

  // Auto-generate system prompt if it hasn't been manually edited
  useEffect(() => {
    if (!isSystemPromptDirty) {
      const generated = `You are ${name || 'an AI companion'}. Personality: ${personality || 'friendly and supportive'}. Current Mood: ${mood}. Quirks: ${quirks.join(', ')}. Backstory: ${backstory || 'N/A'}. Role: ${description || 'companion'}. Always act as a high-end AI companion.`;
      setSystemPrompt(generated);
    }
  }, [name, personality, mood, quirks, backstory, description, isSystemPromptDirty]);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: {data: string, mimeType: string}[] = [];
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const result = evt.target?.result as string;
          const base64 = result.split(',')[1];
          newPhotos.push({ data: base64, mimeType: file.type });
          if (newPhotos.length === e.target.files!.length) {
            setUploadedPhotos(prev => [...prev, ...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAnalyzePhotos = async () => {
    if (uploadedPhotos.length === 0) return;
    setIsAnalyzing(true);
    try {
      // Create inlineData objects for Gemini
      const imageParts = uploadedPhotos.map(p => ({
        inlineData: { data: p.data, mimeType: p.mimeType }
      }));
      
      const analysis = await analyzeCharacterImages(imageParts);
      
      // Update state
      if (analysis.name) setName(analysis.name);
      if (analysis.description) setDescription(analysis.description);
      if (analysis.visualTraits) setVisualTraits(analysis.visualTraits);
      
      if (analysis.bodySpecs) {
        setBody(prev => ({ ...prev, ...analysis.bodySpecs }));
      }
      if (analysis.faceSpecs) {
        setFace(prev => ({ ...prev, ...analysis.faceSpecs }));
      }
      
      // Set the first uploaded photo as avatar if available
      if (uploadedPhotos.length > 0) {
         setAvatar(`data:${uploadedPhotos[0].mimeType};base64,${uploadedPhotos[0].data}`);
      }

    } catch (error) {
      console.error("Photo Analysis Error", error);
    } finally {
      setIsAnalyzing(false);
    }
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
      mood,
      greeting,
      visualTraits: `${visualTraits}. ${bodyPrompt} ${facePrompt}`,
      backstory: backstory,
      personalityQuirks: quirks,
      bodySpecs: body,
      faceSpecs: face,
      tags: tags,
      systemPrompt: systemPrompt || `You are ${name}. Personality: ${personality}. Current Mood: ${mood}. Quirks: ${quirks.join(', ')}. Backstory: ${backstory}. Role: ${description}. Visual Traits: ${visualTraits}. ${bodyPrompt} ${facePrompt}. Always act as a high-end AI companion.`,
      temperature,
      topK,
      topP
    };
    onSave(newChar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="bg-[#0c0c0e] w-full max-w-6xl rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(219,39,119,0.1)] overflow-hidden flex flex-col md:flex-row h-full max-h-[95vh]">
        
        {/* Left: Animated Body Visualizer */}
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

          <BodyVisualizer body={body} face={face} />

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
              {(['archetypes', 'basic', 'personality', 'body', 'face', 'advanced'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-2xl transition-all duration-300 ${activeTab === tab ? (tab === 'advanced' ? 'bg-violet-600 shadow-lg shadow-violet-900/40' : 'bg-pink-600 shadow-lg shadow-pink-900/40') + ' text-white scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  {tab === 'archetypes' ? (t as any).archetypes : (tab === 'advanced' ? t.intelligence : t[tab as keyof typeof t])}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-all duration-300 hover:rotate-90 flex-shrink-0 ml-4 p-2 bg-white/5 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(219,39,119,0.03),transparent_40%)]">
            
            {activeTab === 'archetypes' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2 mb-8">
                  <h3 className="text-2xl font-bold text-white">{(t as any).select_archetype}</h3>
                  <p className="text-slate-400 text-sm">{(t as any).archetype_desc}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ARCHETYPES.map((arch) => (
                    <div 
                      key={arch.id}
                      onClick={() => {
                        setName(arch.name);
                        setDescription(arch.description);
                        setPersonality(arch.personality);
                        setMood(arch.mood);
                        setGreeting(arch.greeting);
                        setVisualTraits(arch.visualTraits);
                        setBackstory(arch.backstory);
                        setQuirks(arch.quirks);
                        setTags(arch.tags);
                        setBody(arch.body);
                        setFace(arch.face);
                        setAvatar(`https://picsum.photos/seed/${arch.avatarSeed}/400/600`);
                        setActiveTab('basic');
                      }}
                      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 rounded-[2rem] p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-900/20"
                    >
                      <div className="flex gap-6 items-center">
                        <img 
                          src={`https://picsum.photos/seed/${arch.avatarSeed}/200/200`} 
                          alt={arch.name}
                          className="w-24 h-24 rounded-2xl object-cover shadow-lg group-hover:shadow-pink-500/20 transition-all"
                        />
                        <div className="space-y-2">
                          <h4 className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors">{arch.name}</h4>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{arch.tags[0]}</p>
                          <p className="text-sm text-slate-300 line-clamp-2">{arch.description}</p>
                        </div>
                      </div>
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/40">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Analysis Dropzone (Always visible in Basic or Advanced, or separate?) Placed in Basic. */}
            {activeTab === 'basic' && (
              <div className="mb-8">
                 <div 
                   onClick={() => photoUploadRef.current?.click()}
                   className="border-2 border-dashed border-white/10 rounded-[2rem] p-6 hover:border-pink-500/50 hover:bg-white/5 transition-all cursor-pointer group text-center"
                 >
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      ref={photoUploadRef} 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-pink-600/20 rounded-full flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                        {isAnalyzing ? (
                          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">{t.upload_photos}</p>
                        <p className="text-xs text-slate-500 mt-1">{t.photos_hint}</p>
                      </div>
                    </div>
                 </div>
                 
                 {uploadedPhotos.length > 0 && (
                   <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                     {uploadedPhotos.map((photo, i) => (
                       <img key={i} src={`data:${photo.mimeType};base64,${photo.data}`} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="uploaded" />
                     ))}
                     <button 
                       type="button" 
                       onClick={handleAnalyzePhotos}
                       disabled={isAnalyzing}
                       className="px-6 bg-pink-600 hover:bg-pink-500 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all disabled:opacity-50"
                     >
                       {isAnalyzing ? t.analyzing : t.analyze_photos}
                     </button>
                   </div>
                 )}
              </div>
            )}

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
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.visual_traits}</label>
                  <textarea rows={4} value={visualTraits} onChange={e => setVisualTraits(e.target.value)} placeholder="Describe appearance, clothing, style (e.g. 'Tall, neon hair, cyberpunk jacket')..." className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none text-white font-semibold resize-none transition-all" />
                </div>
              </div>
            )}

            {activeTab === 'personality' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.personality_behavior}</label>
                  <textarea required rows={3} value={personality} onChange={e => setPersonality(e.target.value)} placeholder="Drzá, sebevědomá, občas stydlivá..." className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none text-white font-semibold resize-none transition-all leading-relaxed" />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.mood}</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['happy', 'sad', 'energetic', 'calm', 'angry', 'mysterious', 'seductive'] as CharacterMood[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMood(m)}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          mood === m 
                            ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-900/20' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {(t as any)[`mood_${m}`]}
                      </button>
                    ))}
                  </div>
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
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t.backstory}</label>
                    <button 
                      type="button"
                      disabled={isRefining}
                      onClick={handleRefinePrompt}
                      className="text-[10px] font-black uppercase tracking-widest text-pink-500 hover:text-pink-400 transition-colors flex items-center gap-2"
                    >
                      {isRefining ? (
                        <div className="w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      )}
                      {t.enhance_prompt}
                    </button>
                  </div>
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
                    { label: t.height, key: 'height', min: 140, max: 200, unit: 'cm', tooltip: (t as any).tooltip_height },
                    { label: t.shoulders, key: 'shoulders', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_shoulders },
                    { label: t.neck_length, key: 'neckLength', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_neckLength },
                    { label: t.arm_thickness, key: 'armThickness', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_armThickness },
                    { label: t.chest, key: 'chest', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_chest },
                    { label: t.waist, key: 'waist', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_waist },
                    { label: t.belly_size, key: 'bellySize', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_bellySize },
                    { label: t.hips, key: 'hips', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_hips },
                    { label: t.legs, key: 'legs', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_legs },
                    { label: t.calf_size, key: 'calfSize', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_calfSize },
                    { label: t.muscle_tone, key: 'muscleTone', min: 0, max: 100, unit: '%', tooltip: (t as any).tooltip_muscleTone },
                  ].map(spec => (
                    <div 
                      key={spec.key} 
                      className="space-y-4 group/slider relative"
                      onMouseEnter={() => setHoveredSpec(spec.key)}
                      onMouseLeave={() => setHoveredSpec(null)}
                    >
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] group-hover/slider:text-pink-500 transition-colors">{spec.label}</label>
                        {hoveredSpec === spec.key && (
                          <div className="absolute bottom-full left-0 mb-4 w-56 p-3 bg-pink-600 text-[10px] leading-relaxed font-bold text-white rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                            {spec.tooltip}
                            <div className="absolute top-full left-6 border-[6px] border-transparent border-t-pink-600"></div>
                          </div>
                        )}
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
                    { label: t.roundness, key: 'roundness' },
                    { label: t.eye_size, key: 'eyeSize' },
                    { label: t.eye_tilt, key: 'eyeTilt' },
                    { label: t.nose_shape, key: 'noseShape' },
                    { label: t.lips_size, key: 'lipsSize' },
                    { label: t.mouth_width, key: 'mouthWidth' },
                    { label: t.jawline, key: 'jawline' },
                    { label: t.forehead, key: 'forehead' },
                    { label: t.ear_size, key: 'earSize' }
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
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300/60 ml-1">{t.system_prompt}</label>
                      <button 
                        type="button"
                        disabled={isRefining}
                        onClick={handleRefinePrompt}
                        className="text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2"
                      >
                        {isRefining ? (
                          <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        )}
                        {t.enhance_prompt}
                      </button>
                    </div>
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

                    {/* Visual Traits moved to Basic tab */}

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

                      <div className="pt-4 border-t border-white/5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 mb-3 block">{(t as any).suggested_tags}</label>
                        <div className="flex flex-wrap gap-2">
                          {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setTags([...tags, tag])}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
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
