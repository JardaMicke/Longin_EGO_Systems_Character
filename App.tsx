
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Settings } from './components/Settings';
import { CharacterCreator } from './components/CharacterCreator';
import { ProfileView } from './components/ProfileView';
import { ImageGenDialog } from './components/ImageGenDialog';
import { VideoGenDialog } from './components/VideoGenDialog';
import { Character, ChatSession, Message, AppSettings, ImageGenerationParams, VideoGenerationParams, ChatMode } from './types';
import { db } from './db';
import { callLLM, generateImage, generateVideo, playVoice } from './llmService';
import { translations } from './locales';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [showImageGen, setShowImageGen] = useState(false);
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [chats, setChats] = useState<Record<string, ChatSession>>({});
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  const [isTyping, setIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [currentMode, setCurrentMode] = useState<ChatMode>('conversation');
  
  const [showSettings, setShowSettings] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  const t = translations[settings.language];

  useEffect(() => {
    setCharacters(db.getCharacters());
    const savedChats = db.getChats();
    const normalizedChats: Record<string, ChatSession> = {};
    Object.keys(savedChats).forEach(id => {
      normalizedChats[id] = { 
        ...savedChats[id], 
        currentMode: savedChats[id].currentMode || 'conversation' 
      };
    });
    setChats(normalizedChats);
  }, []);

  const handleSendMessage = async (text: string, mode: ChatMode) => {
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
              expression: call.args.expression || 'Happy',
              dressType: call.args.dress_type || 'Casual',
              props: [],
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
            await handleVideoRequest(params);
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
        type: 'image'
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
      const videoUrls = await generateVideo(char, settings, params);
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

  const selectedChar = characters.find(c => c.id === selectedId);
  const profileChar = characters.find(c => c.id === viewingProfileId);
  
  const lastUserMessage = selectedId ? [...(chats[selectedId]?.messages || [])].reverse().find(m => m.role === 'user')?.content : '';

  return (
    <div className="flex h-screen bg-black text-slate-100 overflow-hidden">
      <Sidebar 
        characters={characters} 
        selectedId={selectedId} 
        language={settings.language}
        onSelect={(id) => {
          setSelectedId(id);
          setCurrentMode(chats[id]?.currentMode || 'conversation');
        }}
        onViewProfile={setViewingProfileId}
        onOpenSettings={() => setShowSettings(true)}
        onOpenCreator={() => setShowCreator(true)}
        onDeleteCharacter={handleDeleteCharacter}
      />
      
      {selectedChar ? (
        <ChatWindow 
          character={selectedChar}
          messages={chats[selectedId!]?.messages || []}
          currentMode={currentMode}
          language={settings.language}
          onSendMessage={handleSendMessage}
          onSendImageRequest={() => setShowImageGen(true)}
          onSendVideoRequest={() => setShowVideoGen(true)}
          onToggleMode={handleToggleMode}
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

      {showImageGen && (
        <ImageGenDialog 
          isNsfw={settings.isNsfwEnabled}
          language={settings.language}
          onConfirm={handleImageRequest}
          onClose={() => setShowImageGen(false)}
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
