
import React, { useState } from 'react';
import { Character, AppLanguage } from '../types';
import { translations } from '../locales';

interface SidebarProps {
  characters: Character[];
  selectedId: string | null;
  language: AppLanguage;
  onSelect: (id: string) => void;
  onViewProfile: (id: string) => void;
  onOpenSettings: () => void;
  onOpenCreator: () => void;
  onDeleteCharacter: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  characters, 
  selectedId, 
  language,
  onSelect, 
  onViewProfile,
  onOpenSettings,
  onOpenCreator,
  onDeleteCharacter
}) => {
  const t = translations[language];
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const executeDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirmId) {
      onDeleteCharacter(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col relative">
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          {t.sidebar_title}
        </h1>
        <button 
          onClick={onOpenSettings}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-2">
        <button 
          onClick={onOpenCreator}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-pink-500 hover:text-pink-500 transition-all text-slate-400 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.new_companion}
        </button>

        {characters.map(char => (
          <div
            key={char.id}
            className={`group w-full flex items-center gap-4 p-3 rounded-xl transition-all relative ${
              selectedId === char.id ? 'bg-slate-800 ring-1 ring-slate-700' : 'hover:bg-slate-800/50'
            }`}
          >
            <button 
              onClick={() => onSelect(char.id)}
              className="flex items-center gap-4 flex-1 text-left overflow-hidden"
            >
              <div className="relative flex-shrink-0 group/avatar overflow-hidden rounded-full">
                <img 
                  src={char.avatar} 
                  alt={char.name} 
                  className={`w-12 h-12 rounded-full object-cover border border-slate-700 transition-all duration-500 
                    group-hover/avatar:scale-125 group-hover/avatar:rotate-6 
                    ${selectedId === char.id ? 'avatar-selected' : ''}`} 
                />
                {selectedId === char.id && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className={`font-semibold transition-colors ${selectedId === char.id ? 'text-pink-400' : 'text-slate-200'}`}>
                  {char.name}
                </h3>
                <p className="text-xs text-slate-500 truncate">{char.description}</p>
              </div>
            </button>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile(char.id);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-pink-400"
                title={t.view_profile}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                onClick={(e) => confirmDelete(e, char.id)}
                className="p-2 hover:bg-rose-900/30 rounded-lg transition-all text-slate-400 hover:text-rose-500"
                title={t.delete_char}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Delete Confirmation Overlay */}
      {deleteConfirmId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
            <p className="text-sm font-medium text-slate-200">
              {t.confirm_delete.replace('{name}', characters.find(c => c.id === deleteConfirmId)?.name || '')}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold text-white transition-colors shadow-lg shadow-rose-900/20"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 text-center text-xs text-slate-600">
        {t.private_session} • local-db-v1
      </div>
    </div>
  );
};
