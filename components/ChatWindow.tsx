
import React, { useState, useRef, useEffect } from 'react';
import { Character, Message, ChatMode, AppLanguage } from '../types';
import { translations } from '../locales';

interface ChatWindowProps {
  character: Character;
  messages: Message[];
  currentMode: ChatMode;
  language: AppLanguage;
  onSendMessage: (text: string, mode: ChatMode) => void;
  onSendImageRequest: () => void;
  onSendVideoRequest: () => void;
  onToggleMode: (mode: ChatMode) => void;
  isTyping: boolean;
  statusMessage?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  character, 
  messages, 
  currentMode,
  language,
  onSendMessage,
  onSendImageRequest,
  onSendVideoRequest,
  onToggleMode,
  isTyping,
  statusMessage
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, statusMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input, currentMode);
    setInput('');
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-700 ${currentMode === 'scenario' ? 'bg-[#0a060a]' : 'bg-[#050505]'}`}>
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none opacity-40 blur-[100px] transition-all duration-1000 ${currentMode === 'scenario' ? 'bg-violet-900/30' : 'bg-pink-500/20'}`}></div>

      {/* Header */}
      <div className="h-20 border-b border-white/5 flex items-center px-8 gap-5 bg-black/40 backdrop-blur-xl z-10">
        <div className="relative group cursor-pointer">
          <img src={character.avatar} alt={character.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500/30 transition-all group-hover:ring-pink-500 shadow-xl" />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {character.name}
            {currentMode === 'scenario' && <span className="text-[10px] bg-violet-600/30 text-violet-400 px-2 py-0.5 rounded-md border border-violet-500/20 animate-pulse">{t.destiny_mode}</span>}
          </h2>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">
            {statusMessage ? <span className="text-pink-500 animate-pulse">{statusMessage}</span> : t.active_sync}
          </p>
        </div>

        {/* Improved Toggle */}
        <div className="flex bg-black/40 rounded-2xl p-1 border border-white/10 shadow-inner">
          <button 
            onClick={() => onToggleMode('conversation')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${currentMode === 'conversation' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /></svg>
            {t.chat}
          </button>
          <button 
            onClick={() => onToggleMode('scenario')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${currentMode === 'scenario' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
            {t.scenario}
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
            {msg.type === 'narration' ? (
              <div className="w-full flex justify-center py-6">
                 <div className="max-w-2xl bg-violet-950/20 border border-violet-500/10 rounded-3xl p-6 text-center shadow-inner relative group">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-[8px] font-black px-3 py-1 rounded-full text-white uppercase tracking-[0.2em] shadow-lg">{t.narrator}</div>
                    <p className="italic text-violet-300/90 text-sm font-medium leading-relaxed">
                      {msg.content}
                    </p>
                 </div>
              </div>
            ) : (
              <div className={`max-w-[80%] group relative ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-pink-600 to-rose-700 text-white rounded-[2.5rem] rounded-tr-none px-8 py-5 shadow-2xl shadow-pink-900/30' 
                  : 'bg-slate-900/40 backdrop-blur-md border border-white/5 text-slate-100 rounded-[2.5rem] rounded-tl-none px-8 py-5 shadow-xl'
              }`}>
                {msg.type === 'image' && (
                  <div className="rounded-2xl overflow-hidden mb-4 border border-white/10 group-hover:scale-[1.02] transition-transform duration-500">
                    <img src={msg.content} alt="moment" className="w-full h-auto object-cover max-h-[600px]" />
                  </div>
                )}
                {msg.type === 'video' && (
                  <div className="rounded-2xl overflow-hidden mb-4 border border-white/10 bg-black">
                    <video controls src={msg.content} className="w-full" autoPlay muted loop />
                  </div>
                )}
                <p className={`whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'text-[15px] font-semibold' : 'text-[16px] font-medium'} tracking-wide`}>
                  {msg.content}
                </p>
                <div className={`text-[8px] mt-4 uppercase tracking-[0.2em] font-black opacity-30 flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.mode === 'scenario' ? <span className="text-violet-400">● {t.reality}</span> : <span>● {t.chat.toUpperCase()}</span>}
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-4 rounded-full flex gap-2">
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      {/* Input section */}
      <div className="p-8 pt-2 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          <div className="flex gap-4">
             <button onClick={onSendImageRequest} className="group flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-pink-600/10 border border-white/5 rounded-2xl transition-all">
                <svg className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-pink-400">{t.snapshot}</span>
             </button>
             <button onClick={onSendVideoRequest} className="group flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-violet-600/10 border border-white/5 rounded-2xl transition-all">
                <svg className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-violet-400">{t.story}</span>
             </button>
          </div>

          <form onSubmit={handleSubmit} className="relative group/input">
            <div className={`absolute -inset-1 rounded-[3rem] blur opacity-25 group-focus-within/input:opacity-50 transition-opacity duration-500 ${currentMode === 'scenario' ? 'bg-violet-600' : 'bg-pink-600'}`}></div>
            <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-[3rem] p-2 pr-4">
               <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentMode === 'scenario' ? t.placeholder_scenario : t.placeholder_msg}
                className="flex-1 bg-transparent border-none py-5 px-6 focus:ring-0 outline-none text-white text-lg placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 disabled:opacity-50 ${currentMode === 'scenario' ? 'bg-violet-600 hover:bg-violet-500' : 'bg-pink-600 hover:bg-pink-500'}`}
              >
                <svg className="w-7 h-7 text-white translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
          <div className="flex justify-between items-center px-6">
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">{t.truth_mode_active}</p>
             <p className="text-[9px] text-pink-500/50 font-bold uppercase tracking-[0.2em]">{t.secure_sandbox}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
