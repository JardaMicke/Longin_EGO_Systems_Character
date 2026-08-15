
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Settings } from './components/Settings';
import { CharacterCreator } from './components/CharacterCreator';
import { ScenarioCreator } from './components/ScenarioCreator';
import { ScenarioGraphEditor } from './components/ScenarioGraphEditor';
import { ProfileView } from './components/ProfileView';
import { ImageGenDialog } from './components/ImageGenDialog';
import { ImageEditorDialog } from './components/ImageEditorDialog';
import { VideoGenDialog } from './components/VideoGenDialog';
import { Character, ChatSession, Message, AppSettings, ImageGenerationParams, VideoGenerationParams, ChatMode, Scenario, ScenarioSession } from './types';
import { db, defaultSettings } from './db';
import { callLLM, callScenarioLLM, generateImage, generateVideo, playVoice } from './llmService';
import { translations } from './locales';
import { playUISound } from './audio';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [showImageGen, setShowImageGen] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [chats, setChats] = useState<Record<string, ChatSession>>({});
  const [scenarioChats, setScenarioChats] = useState<Record<string, ScenarioSession>>({});
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [currentMode, setCurrentMode] = useState<ChatMode>('conversation');
  const [isNarratorMode, setIsNarratorMode] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showScenarioCreator, setShowScenarioCreator] = useState(false);
  const [showGraphEditor, setShowGraphEditor] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | undefined>(undefined);

  const t = translations[settings.language];

  useEffect(() => {
    const loadData = async () => {
      setSettings(await db.getSettings());
      const chars = await db.getCharacters();
      setCharacters(chars);
      setScenarios(await db.getScenarios());
      
      const savedChats = await db.getChats();
      const normalizedChats: Record<string, ChatSession> = {};
      Object.keys(savedChats).forEach(id => {
        normalizedChats[id] = { 
          ...savedChats[id], 
          currentMode: savedChats[id].currentMode || 'conversation' 
        };
      });
      setChats(normalizedChats);
      
      const sChats = await db.getScenarioChats();
      setScenarioChats(sChats);

      // Restore active session
      const lastScenarioId = localStorage.getItem('companion_active_scenario_id');
      const lastCharId = localStorage.getItem('companion_active_char_id');
      const lastMode = localStorage.getItem('companion_active_mode') as ChatMode;
      const lastNarratorMode = localStorage.getItem('companion_active_narrator_mode') === 'true';

      if (lastScenarioId && sChats[lastScenarioId]) {
        setSelectedScenarioId(lastScenarioId);
        setCurrentMode('scenario');
        setIsNarratorMode(lastNarratorMode);
      } else if (lastCharId && normalizedChats[lastCharId]) {
        setSelectedId(lastCharId);
        setCurrentMode(lastMode || normalizedChats[lastCharId]?.currentMode || 'conversation');
      }
      setIsLoadingData(false);
    };
    loadData();
  }, []);

  // Save active session state whenever it changes
  useEffect(() => {
    if (selectedScenarioId) {
      localStorage.setItem('companion_active_scenario_id', selectedScenarioId);
      localStorage.setItem('companion_active_narrator_mode', isNarratorMode.toString());
      localStorage.removeItem('companion_active_char_id');
    } else if (selectedId) {
      localStorage.setItem('companion_active_char_id', selectedId);
      localStorage.setItem('companion_active_mode', currentMode);
      localStorage.removeItem('companion_active_scenario_id');
    } else {
      localStorage.removeItem('companion_active_scenario_id');
      localStorage.removeItem('companion_active_char_id');
    }
  }, [selectedId, selectedScenarioId, currentMode, isNarratorMode]);

  const moodToExpression = (m?: string) => {
    switch(m) {
      case 'happy': return 'Happy';
      case 'sad': return 'Serious';
      case 'energetic': return 'Surprised';
      case 'calm': return 'Shy';
      case 'angry': return 'Angry';
      case 'mysterious': return 'Serious';
      case 'seductive': return 'Seductive';
      default: return 'Happy';
    }
  };

  
  const handleSaveGraph = async (updatedScenario: Scenario) => {
    const updated = scenarios.map(s => s.id === updatedScenario.id ? updatedScenario : s);
    setScenarios(updated);
    await db.saveScenarios(updated);
  };

  const handleSendMessage = async (text: string, mode: ChatMode) => {
    if (selectedScenarioId) {
      await handleSendScenarioMessage(text);
      return;
    }
    if (!selectedId) return;
    
    const char = characters.find(c => c.id === selectedId)!;
    const session = chats[selectedId] || { characterId: selectedId, messages: [], currentMode: mode };
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type: mode === 'scenario' ? 'narration' : 'text',
      mode: mode
    };

    const updatedMessages = [...(session.messages || []), userMsg];
    const updatedSession = { ...session, messages: updatedMessages, currentMode: mode };
    
    setChats(prev => ({ ...prev, [selectedId]: updatedSession }));
    db.saveChat(selectedId, updatedSession);
    
    setIsTyping(true);
    setStatusMessage(mode === 'scenario' ? "..." : `${char.name}...`);

    try {
      const result = await callLLM(settings, char, updatedMessages.slice(-20), text, mode);
      
      // Přidáme textovou odpověď
      if (result.text) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.text,
          timestamp: Date.now(),
          type: 'text',
          mode: mode
        };
        const updatedWithText = { ...updatedSession, messages: [...updatedMessages, assistantMsg] };
        setChats(prev => ({ ...prev, [selectedId]: updatedWithText }));
        db.saveChat(selectedId, updatedWithText);
        if (settings.voiceEnabled) playVoice(result.text, settings, selectedChar?.voiceName);
        if (settings.messageSoundEnabled) playUISound('message', settings.uiVolume);
      }

      // Zpracujeme volání funkcí (obrázky/videa)
      if (result.toolCalls) {
        let currentIteratedMood = char.mood;
        for (const call of result.toolCalls) {
          if (call.name === 'generate_image') {
            const params: ImageGenerationParams = {
              aspectRatio: '1:1',
              quality: (call.args.quality as any) || '1K',
              style: call.args.style || 'Photorealistic',
              pose: call.args.pose || 'Standing',
              expression: call.args.expression || moodToExpression(currentIteratedMood),
              dressType: call.args.dress_type || 'Casual',
              props: [],
              tags: call.args.tags || [],
              isSequential: false,
              count: 1,
              allAngles: false
            };
            await handleImageRequest(params);
          
          } else if (call.name === 'update_mood') {
            const newMood = call.args.new_mood;
            const reason = call.args.reason;
            if (newMood) {
               currentIteratedMood = newMood;
               setCharacters(prev => {
                 const newChars = prev.map(c => {
                   if (c.id === char.id) {
                     const updatedChar = { ...c, mood: newMood };
                     const moodMem = { mood: newMood, timestamp: Date.now(), reason: reason || 'Conversation context' };
                     updatedChar.moodHistory = [...(c.moodHistory || []), moodMem];
                     return updatedChar;
                   }
                   return c;
                 });
                 db.saveCharacters(newChars);
                 return newChars;
               });
               setStatusMessage(`${char.name} se cítí: ${newMood}`);
               if (settings.moodSoundEnabled) playUISound('mood', settings.uiVolume);
            }
} else if (call.name === 'generate_video') {
            const params: VideoGenerationParams = {
              prompt: call.args.prompt,
              aspectRatio: (call.args.aspectRatio as any) || '9:16',
              resolution: (call.args.resolution as any) || '720p',
              segments: 1
            };
            await generateVideo(char, settings, params, (msg) => {
              setStatusMessage(`${char.name}: ${msg}`);
            }).then(videoUrls => {
              const session = chats[selectedId] || { characterId: selectedId, messages: [], currentMode: mode };
              const videoMessages: Message[] = videoUrls.map((url, idx) => ({
                id: (Date.now() + idx).toString(),
                role: 'assistant',
                content: url,
                timestamp: Date.now(),
                type: 'video'
              }));
              const updatedSession = { ...session, messages: [...(session.messages || []), ...videoMessages] };
              setChats(prev => ({ ...prev, [selectedId]: updatedSession }));
              db.saveChat(selectedId, updatedSession);
            });
          }
        }
      }
    } catch (error) {
      console.error("LLM Error:", error);
    } finally {
      setIsTyping(false);
      setStatusMessage(undefined);
    }
  };

  const handleSendScenarioMessage = async (text: string) => {
    if (!selectedScenarioId) return;
    
    const scenario = scenarios.find(s => s.id === selectedScenarioId)!;
    const session = scenarioChats[selectedScenarioId] || { scenarioId: selectedScenarioId, messages: [], isNarratorMode: isNarratorMode };
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type: isNarratorMode ? 'narration' : 'text',
      mode: 'scenario'
    };

    const updatedMessages = [...(session.messages || []), userMsg];
    const updatedSession = { ...session, messages: updatedMessages, isNarratorMode };
    
    setScenarioChats(prev => ({ ...prev, [selectedScenarioId]: updatedSession }));
    db.saveScenarioChat(selectedScenarioId, updatedSession);
    
    setIsTyping(true);
    setStatusMessage(isNarratorMode ? "..." : "...");

    try {
      const scenarioCharacters = characters.filter(c => scenario.characterIds.includes(c.id));
      
      const currentNodeId = updatedSession.currentNodeId || (scenario.nodes && scenario.nodes.length > 0 ? scenario.nodes[0].id : undefined);
      const currentNodeData = scenario.nodes?.find(n => n.id === currentNodeId)?.data;
      const result = await callScenarioLLM(settings, scenario, currentNodeData, scenarioCharacters, updatedMessages.slice(-20), text, isNarratorMode);

      
      if (result.text) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.text,
          timestamp: Date.now(),
          type: 'text',
          mode: 'scenario'
        };
        const updatedWithText = { ...updatedSession, messages: [...updatedMessages, assistantMsg] };
        setScenarioChats(prev => ({ ...prev, [selectedScenarioId]: updatedWithText }));
        db.saveScenarioChat(selectedScenarioId, updatedWithText);
        if (settings.voiceEnabled) playVoice(result.text, settings, "Puck");
        if (settings.messageSoundEnabled) playUISound('message', settings.uiVolume);
      }
    } catch (error) {
      console.error("Scenario LLM Error:", error);
    } finally {
      setIsTyping(false);
      setStatusMessage(undefined);
    }
  };

  const handleToggleMode = (mode: ChatMode) => {
    setCurrentMode(mode);
    if (selectedId) {
      setChats(prev => ({
        ...prev,
        [selectedId]: { ...prev[selectedId], currentMode: mode }
      }));
    }
  };

  const handleImageRequest = async (params: ImageGenerationParams) => {
    if (!selectedId) return;
    const char = characters.find(c => c.id === selectedId)!;
    setShowImageGen(false);
    setIsTyping(true);
    setStatusMessage(`${char.name} fotí...`);
    try {
      const imageUrls = await generateImage(char, params, settings);
      const session = chats[selectedId] || { characterId: selectedId, messages: [], currentMode: currentMode };
      const newMessages: Message[] = imageUrls.map((url, idx) => ({
        id: (Date.now() + idx).toString(),
        role: 'assistant',
        content: url,
        timestamp: Date.now(),
        type: 'image',
        tags: params.tags
      }));
      const updatedSession = { ...session, messages: [...(session.messages || []), ...newMessages] };
      setChats(prev => ({ ...prev, [selectedId]: updatedSession }));
      db.saveChat(selectedId, updatedSession);
    } catch (error) {
      console.error("Image Gen Error:", error);
    } finally {
      setIsTyping(false);
      setStatusMessage(undefined);
    }
  };

  const handleVideoRequest = async (params: VideoGenerationParams) => {
    if (!selectedId) return;
    const char = characters.find(c => c.id === selectedId)!;
    setShowVideoGen(false);
    setIsTyping(true);
    setStatusMessage(`${char.name} natáčí...`);
    try {
      const videoUrls = await generateVideo(char, settings, params, (msg) => {
        setStatusMessage(`${char.name}: ${msg}`);
      });
      const session = chats[selectedId] || { characterId: selectedId, messages: [], currentMode: currentMode };
      const videoMessages: Message[] = videoUrls.map((url, idx) => ({
        id: (Date.now() + idx).toString(),
        role: 'assistant',
        content: url,
        timestamp: Date.now(),
        type: 'video'
      }));
      const updatedSession = { ...session, messages: [...(session.messages || []), ...videoMessages] };
      setChats(prev => ({ ...prev, [selectedId]: updatedSession }));
      db.saveChat(selectedId, updatedSession);
    } catch (error) {
      console.error("Video Gen Error:", error);
    } finally {
      setIsTyping(false);
      setStatusMessage(undefined);
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    db.saveSettings(newSettings);
    setShowSettings(false);
  };

  const handleCreateCharacter = (newChar: Character) => {
    const updated = [...characters, newChar];
    setCharacters(updated);
    db.saveCharacters(updated);
    setShowCreator(false);
    setSelectedId(newChar.id);
  };

  const handleUpdateCharacter = (updatedChar: Character) => {
    const updated = characters.map(c => c.id === updatedChar.id ? updatedChar : c);
    setCharacters(updated);
    db.saveCharacters(updated);
  };

  const handleDeleteCharacter = (id: string) => {
    const updatedChars = characters.filter(c => c.id !== id);
    setCharacters(updatedChars);
    db.saveCharacters(updatedChars);
    
    const updatedChats = { ...chats };
    delete updatedChats[id];
    setChats(updatedChats);
    localStorage.setItem('companion_chats', JSON.stringify(updatedChats));

    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleCreateScenario = (newScenario: Scenario) => {
    let updated;
    if (scenarios.some(s => s.id === newScenario.id)) {
      updated = scenarios.map(s => s.id === newScenario.id ? newScenario : s);
    } else {
      updated = [...scenarios, newScenario];
    }
    setScenarios(updated);
    db.saveScenarios(updated);
    setShowScenarioCreator(false);
    setEditingScenario(undefined);
    setSelectedScenarioId(newScenario.id);
    setSelectedId(null);
  };

  const handleDeleteScenario = (id: string) => {
    const updatedScenarios = scenarios.filter(s => s.id !== id);
    setScenarios(updatedScenarios);
    db.saveScenarios(updatedScenarios);
    
    const updatedChats = { ...scenarioChats };
    delete updatedChats[id];
    setScenarioChats(updatedChats);
    localStorage.setItem('companion_scenario_chats', JSON.stringify(updatedChats));

    if (selectedScenarioId === id) {
      setSelectedScenarioId(null);
    }
  };

  const handleToggleNarrator = () => {
    const nextMode = !isNarratorMode;
    setIsNarratorMode(nextMode);
    if (selectedScenarioId) {
      setScenarioChats(prev => {
        const session = prev[selectedScenarioId];
        if (!session) return prev;
        const updated = { ...session, isNarratorMode: nextMode };
        db.saveScenarioChat(selectedScenarioId, updated);
        return { ...prev, [selectedScenarioId]: updated };
      });
    }
  };

  const selectedChar = characters.find(c => c.id === selectedId);
  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);
  const profileChar = characters.find(c => c.id === viewingProfileId);
  
  const lastUserMessage = selectedId ? [...(chats[selectedId]?.messages || [])].reverse().find(m => m.role === 'user')?.content : '';

  return (
    <div className="flex h-[100dvh] w-full bg-black text-slate-100 relative">
      <Sidebar 
        isOpen={showMobileSidebar}
        onCloseMobile={() => setShowMobileSidebar(false)}
        characters={characters} 
        scenarios={scenarios}
        selectedId={selectedId} 
        selectedScenarioId={selectedScenarioId}
        language={settings.language}
        onSelect={(id) => {
          setSelectedId(id);
          setSelectedScenarioId(null);
          setCurrentMode(chats[id]?.currentMode || 'conversation');
          setShowMobileSidebar(false);
        }}
        onSelectScenario={(id) => {
          setSelectedScenarioId(id);
          setSelectedId(null);
          setCurrentMode('scenario');
          setIsNarratorMode(scenarioChats[id]?.isNarratorMode || false);
          setShowMobileSidebar(false);
          setShowMobileSidebar(false);
        }}
        onViewProfile={setViewingProfileId}
        onOpenSettings={() => setShowSettings(true)}
        onOpenImageEditor={() => { setShowImageEditor(true); setShowMobileSidebar(false); }}
        onOpenCreator={() => setShowCreator(true)}
        onOpenScenarioCreator={() => setShowScenarioCreator(true)}
        onDeleteCharacter={handleDeleteCharacter}
        onDeleteScenario={handleDeleteScenario}
        onOpenGraphEditor={(scenario) => {
          setSelectedScenarioId(scenario.id);
          setShowGraphEditor(true);
        }}
        onEditScenario={(scenario) => {
          setEditingScenario(scenario);
          setShowScenarioCreator(true);
        }}
      />
      
      {selectedChar || selectedScenario ? (
        <ChatWindow 

          currentNodeId={selectedScenarioId ? scenarioChats[selectedScenarioId]?.currentNodeId : undefined}
          onNodeTransition={(nodeId) => {
            if (selectedScenarioId) {
              setScenarioChats(prev => ({
                ...prev,
                [selectedScenarioId]: {
                  ...prev[selectedScenarioId],
                  currentNodeId: nodeId
                }
              }));
              // Add system message about transition
              const sysMsg: Message = {
                id: (Date.now()).toString(),
                role: 'system',
                content: `[SCENE TRANSITION] ${scenarios.find(s => s.id === selectedScenarioId)?.nodes?.find(n => n.id === nodeId)?.data?.label || 'New Scene'}`,
                timestamp: Date.now(),
                type: 'system',
                mode: 'scenario'
              };
              setScenarioChats(prev => ({
                ...prev,
                [selectedScenarioId]: {
                  ...prev[selectedScenarioId],
                  messages: [...(prev[selectedScenarioId]?.messages || []), sysMsg]
                }
              }));
            }
          }}
          character={selectedChar || { name: selectedScenario?.title || '', avatar: '', description: selectedScenario?.description || '' } as any}
          scenario={selectedScenario}
          messages={selectedScenarioId ? (scenarioChats[selectedScenarioId!]?.messages || []) : (chats[selectedId!]?.messages || [])}
          currentMode={currentMode}
          isNarratorMode={isNarratorMode}
          language={settings.language}
          onSendMessage={handleSendMessage}
          onSendImageRequest={() => setShowImageGen(true)}
          onSendVideoRequest={() => setShowVideoGen(true)}
          onToggleMode={handleToggleMode}
          onToggleNarrator={handleToggleNarrator}
          isTyping={isTyping}
          statusMessage={statusMessage}


          isVoiceEnabled={settings.voiceEnabled}
          onToggleVoice={() => {
            const newSettings = { ...settings, voiceEnabled: !settings.voiceEnabled };
            setSettings(newSettings);
            db.saveSettings(newSettings);
          }}
          onMoodChange={(mood: any, reason: string) => {
            if (selectedChar) {
              setCharacters(prev => {
                const newChars = prev.map(c => {
                  if (c.id === selectedChar.id) {
                    const moodMem = { mood, timestamp: Date.now(), reason };
                    return { ...c, mood, moodHistory: [...(c.moodHistory || []), moodMem] };
                  }
                  return c;
                });
                db.saveCharacters(newChars);
                return newChars;
              });
              setStatusMessage(`Manuální změna nálady: ${mood}`);
              if (settings.moodSoundEnabled) playUISound('mood', settings.uiVolume);
            }
          }}

        />
      ) : (
        
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#050505] relative">
          <button 
            onClick={() => setShowMobileSidebar(true)} 
            className="md:hidden absolute top-6 left-6 p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10 border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

           <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(219,39,119,0.05)_0%,transparent_70%)]"></div>
           <div className="w-24 h-24 bg-pink-600/10 rounded-full flex items-center justify-center mb-8 ring-1 ring-pink-500/20 shadow-2xl shadow-pink-500/10">
            <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">{t.intro_title}</h1>
          <p className="text-slate-500 max-w-sm font-medium leading-relaxed">{t.intro_desc}</p>
          <button onClick={() => setShowCreator(true)} className="mt-10 px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold transition-all shadow-xl shadow-pink-900/30">{t.create_char}</button>
        </div>
      )}

      {showSettings && (
        <Settings 
          settings={settings} 
          onSave={handleSaveSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {showCreator && (
        <CharacterCreator 
          onSave={handleCreateCharacter}
          onClose={() => setShowCreator(false)}
          language={settings.language}
        />
      )}

      
      {showGraphEditor && selectedScenario && (
        <ScenarioGraphEditor
          scenario={selectedScenario}
          onClose={() => setShowGraphEditor(false)}
          onSave={handleSaveGraph}
        />
      )}

      {showScenarioCreator && (
        <ScenarioCreator 
          characters={characters}
          language={settings.language}
          onSave={handleCreateScenario}
          initialScenario={editingScenario}
          onClose={() => {
            setShowScenarioCreator(false);
            setEditingScenario(undefined);
          }}
        />
      )}


      {showImageEditor && (
        <ImageEditorDialog 
          language={settings.language}
          onClose={() => setShowImageEditor(false)}
        />
      )}

      {showImageGen && (
        <ImageGenDialog 
          isNsfw={settings.isNsfwEnabled}
          language={settings.language}
          onConfirm={handleImageRequest}
          onClose={() => setShowImageGen(false)}
          initialMood={selectedChar?.mood}
        />
      )}

      {showVideoGen && (
        <VideoGenDialog
          language={settings.language}
          onConfirm={handleVideoRequest}
          onClose={() => setShowVideoGen(false)}
          initialPrompt={lastUserMessage}
        />
      )}

      {profileChar && (
        <ProfileView 
          character={profileChar}
          language={settings.language}
          settings={settings}
          onClose={() => setViewingProfileId(null)}
          onStartChat={(id) => {
            setSelectedId(id);
            setViewingProfileId(null);
          }}
          onUpdateCharacter={handleUpdateCharacter}
        />
      )}
    </div>
  );
};

export default App;
