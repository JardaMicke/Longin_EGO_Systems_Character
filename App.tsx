
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Settings } from './components/Settings';
import { CharacterCreator } from './components/CharacterCreator';
import { ScenarioCreator } from './components/ScenarioCreator';
import { ProfileView } from './components/ProfileView';
import { ImageGenDialog } from './components/ImageGenDialog';
import { VideoGenDialog } from './components/VideoGenDialog';
import { Character, ChatSession, Message, AppSettings, ImageGenerationParams, VideoGenerationParams, ChatMode, Scenario, ScenarioSession } from './types';
import { db } from './db';
import { callLLM, callScenarioLLM, generateImage, generateVideo, playVoice } from './llmService';
import { translations } from './locales';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [showImageGen, setShowImageGen] = useState(false);
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [chats, setChats] = useState<Record<string, ChatSession>>({});
  const [scenarioChats, setScenarioChats] = useState<Record<string, ScenarioSession>>({});
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  const [isTyping, setIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [currentMode, setCurrentMode] = useState<ChatMode>('conversation');
  const [isNarratorMode, setIsNarratorMode] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showScenarioCreator, setShowScenarioCreator] = useState(false);

  const t = translations[settings.language];

  useEffect(() => {
    setCharacters(db.getCharacters());
    setScenarios(db.getScenarios());
    const savedChats = db.getChats();
    const normalizedChats: Record<string, ChatSession> = {};
    Object.keys(savedChats).forEach(id => {
      normalizedChats[id] = { 
        ...savedChats[id], 
        currentMode: savedChats[id].currentMode || 'conversation' 
      };
    });
    setChats(normalizedChats);
    setScenarioChats(db.getScenarioChats());
  }, []);

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

    const updatedMessages = [...session.messages, userMsg];
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
        if (settings.voiceEnabled) playVoice(result.text, settings);
      }

      // Zpracujeme volání funkcí (obrázky/videa)
      if (result.toolCalls) {
        for (const call of result.toolCalls) {
          if (call.name === 'generate_image') {
            const params: ImageGenerationParams = {
              aspectRatio: '1:1',
              quality: (call.args.quality as any) || '1K',
              style: call.args.style || 'Photorealistic',
              pose: call.args.pose || 'Standing',
              expression: call.args.expression || moodToExpression(char.mood),
              dressType: call.args.dress_type || 'Casual',
              props: [],
              tags: call.args.tags || [],
              isSequential: false,
              count: 1,
              allAngles: false
            };
            await handleImageRequest(params);
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
              const updatedSession = { ...session, messages: [...session.messages, ...videoMessages] };
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

    const updatedMessages = [...session.messages, userMsg];
    const updatedSession = { ...session, messages: updatedMessages, isNarratorMode };
    
    setScenarioChats(prev => ({ ...prev, [selectedScenarioId]: updatedSession }));
    db.saveScenarioChat(selectedScenarioId, updatedSession);
    
    setIsTyping(true);
    setStatusMessage(isNarratorMode ? "..." : "...");

    try {
      const scenarioCharacters = characters.filter(c => scenario.characterIds.includes(c.id));
      const result = await callScenarioLLM(settings, scenario, scenarioCharacters, updatedMessages.slice(-20), text, isNarratorMode);
      
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
      const updatedSession = { ...session, messages: [...session.messages, ...newMessages] };
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
      const updatedSession = { ...session, messages: [...session.messages, ...videoMessages] };
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
    const updated = [...scenarios, newScenario];
    setScenarios(updated);
    db.saveScenarios(updated);
    setShowScenarioCreator(false);
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
    <div className="flex h-screen bg-black text-slate-100 overflow-hidden">
      <Sidebar 
        characters={characters} 
        scenarios={scenarios}
        selectedId={selectedId} 
        selectedScenarioId={selectedScenarioId}
        language={settings.language}
        onSelect={(id) => {
          setSelectedId(id);
          setSelectedScenarioId(null);
          setCurrentMode(chats[id]?.currentMode || 'conversation');
        }}
        onSelectScenario={(id) => {
          setSelectedScenarioId(id);
          setSelectedId(null);
          setCurrentMode('scenario');
          setIsNarratorMode(scenarioChats[id]?.isNarratorMode || false);
        }}
        onViewProfile={setViewingProfileId}
        onOpenSettings={() => setShowSettings(true)}
        onOpenCreator={() => setShowCreator(true)}
        onOpenScenarioCreator={() => setShowScenarioCreator(true)}
        onDeleteCharacter={handleDeleteCharacter}
        onDeleteScenario={handleDeleteScenario}
      />
      
      {selectedChar || selectedScenario ? (
        <ChatWindow 
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
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#050505] relative">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(219,39,119,0.05)_0%,transparent_70%)]"></div>
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

      {showScenarioCreator && (
        <ScenarioCreator 
          characters={characters}
          language={settings.language}
          onSave={handleCreateScenario}
          onClose={() => setShowScenarioCreator(false)}
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
          onClose={() => setViewingProfileId(null)}
          onStartChat={(id) => {
            setSelectedId(id);
            setViewingProfileId(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
