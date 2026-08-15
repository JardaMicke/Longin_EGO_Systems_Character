
import React, { useState } from 'react';
import { Character, AppLanguage, Scenario } from '../types';
import { translations } from '../locales';

interface SidebarProps {
  isOpen?: boolean;
  onCloseMobile?: () => void;
  characters: Character[];
  scenarios: Scenario[];
  selectedId: string | null;
  selectedScenarioId: string | null;
  language: AppLanguage;
  onSelect: (id: string) => void;
  onSelectScenario: (id: string) => void;
  onViewProfile: (id: string) => void;
  onOpenSettings: () => void;
  onOpenImageEditor: () => void;
  onOpenCreator: () => void;
  onOpenScenarioCreator: () => void;
  onDeleteCharacter: (id: string) => void;
  onDeleteScenario: (id: string) => void;
  onEditScenario?: (scenario: Scenario) => void;
  onOpenGraphEditor?: (scenario: Scenario) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile, 
  characters, 
  scenarios,
  selectedId, 
  selectedScenarioId,
  language,
  onSelect, 
  onSelectScenario,
  onViewProfile,
  onOpenSettings,
  onOpenImageEditor,
  onOpenCreator,
  onOpenScenarioCreator,
  onDeleteCharacter,
  onDeleteScenario,
  onEditScenario,
  onOpenGraphEditor
}) => {
  const t = translations[language] as any;
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteScenarioConfirmId, setDeleteScenarioConfirmId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'characters' | 'scenarios'>('characters');

  const allTags = Array.from(new Set(characters.flatMap(c => c.tags || []))).sort();
  const filteredCharacters = filterTag 
    ? characters.filter(c => c.tags?.includes(filterTag))
    : characters;

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
    <>
      {isOpen && <div className="fixed inset-0 bg-black/80 z-[90] md:hidden backdrop-blur-sm cursor-pointer touch-manipulation" onClick={onCloseMobile} />}
    <div className={`fixed inset-y-0 left-0 z-[100] w-80 max-w-[85vw] pointer-events-auto bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 shadow-2xl ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}>
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          {t.sidebar_title}
        </h1>
        
        <div className="flex gap-2">

          <button 
            onClick={onOpenImageEditor}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors group relative"
            title={language === 'cs' ? 'Editor fotografií' : 'Photo Editor'}
          >
            <svg className="w-5 h-5 text-slate-400 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button 
            onClick={onOpenSettings}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <button 
            onClick={onCloseMobile}
            className="md:hidden flex items-center justify-center gap-2 px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-lg transition-colors text-pink-500 font-bold text-xs uppercase tracking-wider"
          >
            Zavřít
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

        </div>

      </div>

      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('characters')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'characters' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.character}
        </button>
        <button 
          onClick={() => setActiveTab('scenarios')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'scenarios' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.scenarios}
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {activeTab === 'characters' ? (
          <>
            <button 
              onClick={onOpenCreator}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-pink-500 hover:text-pink-500 transition-all text-slate-400 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.new_companion}
            </button>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                <button
                  onClick={() => setFilterTag(null)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filterTag === null 
                      ? 'bg-white text-black' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {t.all_characters}
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      filterTag === tag 
                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/40' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {filteredCharacters.length === 0 && (
              <div className="text-center py-16 px-4 flex flex-col items-center justify-center opacity-70">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700">
                   <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                   </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-300 mb-1">{t.no_characters_found}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">{language === 'cs' ? 'Vytvořte svou první postavu kliknutím na tlačítko výše.' : 'Create your first character by clicking the button above.'}</p>
              </div>
            )}

            {filteredCharacters.map(char => (
              <div
                key={char.id}
                className={`group w-full flex items-center gap-4 p-3 rounded-xl transition-all relative cursor-pointer border ${
                  selectedId === char.id && !selectedScenarioId 
                    ? 'bg-slate-800 border-pink-500/30 ring-1 ring-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.1)]' 
                    : 'border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'
                }`}
                onClick={() => onSelect(char.id)}
              >
                <div className="flex items-center gap-4 flex-1 text-left overflow-hidden">
                  <div className="relative flex-shrink-0 group/avatar overflow-hidden rounded-full">
                    <img 
                      src={char.avatar || undefined} 
                      alt={char.name} 
                      className={`w-12 h-12 rounded-full object-cover border-2 transition-all duration-500 
                        group-hover/avatar:scale-110
                        ${selectedId === char.id && !selectedScenarioId ? 'border-pink-500' : 'border-slate-700'}`} 
                    />
                    {selectedId === char.id && !selectedScenarioId && (
                      <span className="absolute -bottom-0 -right-0 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500 border-2 border-slate-900"></span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`font-semibold text-sm truncate transition-colors ${selectedId === char.id && !selectedScenarioId ? 'text-pink-400' : 'text-slate-200 group-hover:text-white'}`}>
                        {char.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors line-clamp-1">{char.description || (language === 'cs' ? 'Bez popisu' : 'No description')}</p>
                  </div>
                </div>
                
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(char.id);
                    }}
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
          </>
        ) : (
          <>
            <button 
              onClick={onOpenScenarioCreator}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-pink-500 hover:text-pink-500 transition-all text-slate-400 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.new_scenario}
            </button>

            {scenarios.length === 0 && (
              <div className="text-center py-16 px-4 flex flex-col items-center justify-center opacity-70">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700">
                   <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                   </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-300 mb-1">{t.no_scenarios}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">{language === 'cs' ? 'Napište svůj první příběh kliknutím na tlačítko výše.' : 'Write your first story by clicking the button above.'}</p>
              </div>
            )}

            {scenarios.map(scenario => (
              <div
                key={scenario.id}
                className={`group w-full flex items-center gap-4 p-3 rounded-xl transition-all relative cursor-pointer border ${
                  selectedScenarioId === scenario.id 
                    ? 'bg-slate-800 border-pink-500/30 ring-1 ring-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.1)]' 
                    : 'border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'
                }`}
                onClick={() => onSelectScenario(scenario.id)}
              >
                <div className="flex items-center gap-4 flex-1 text-left overflow-hidden">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                      selectedScenarioId === scenario.id ? 'bg-pink-900/20 border-pink-500' : 'bg-slate-800 border-slate-700 group-hover:bg-slate-700'
                    }`}>
                    <svg className={`w-6 h-6 transition-all duration-500 group-hover:scale-110 ${selectedScenarioId === scenario.id ? 'text-pink-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`font-semibold text-sm truncate transition-colors ${selectedScenarioId === scenario.id ? 'text-pink-400' : 'text-slate-200 group-hover:text-white'}`}>
                        {scenario.title}
                      </h3>
                    </div>
                    {scenario.characterIds && scenario.characterIds.length > 0 && (
                       <span className="text-[9px] uppercase tracking-wider font-bold text-violet-400 mb-0.5 block truncate">
                         {language === 'cs' ? 'Postav: ' : 'Chars: '} {scenario.characterIds.length}
                       </span>
                    )}
                    <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors line-clamp-1">{scenario.description.replace(/<[^>]*>?/gm, '') || (language === 'cs' ? 'Bez popisu' : 'No description')}</p>
                    
                    {scenario.tags && scenario.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {scenario.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${selectedScenarioId === scenario.id ? 'bg-pink-500/20 text-pink-300' : 'bg-white/5 text-slate-400'}`}>
                            {tag}
                          </span>
                        ))}
                        {scenario.tags.length > 3 && (
                          <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${selectedScenarioId === scenario.id ? 'bg-pink-500/20 text-pink-300' : 'bg-white/5 text-slate-400'}`}>
                            +{scenario.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  
                  {onOpenGraphEditor && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGraphEditor(scenario);
                      }}
                      className="p-2 hover:bg-emerald-900/30 rounded-lg transition-all text-slate-400 hover:text-emerald-500"
                      title="Open Graph Editor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6m-6 4h6m-6 4h6" />
                      </svg>
                    </button>
                  )}

                  {onEditScenario && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditScenario(scenario);
                      }}
                      className="p-2 hover:bg-pink-900/30 rounded-lg transition-all text-slate-400 hover:text-pink-500"
                      title={language === 'cs' ? 'Upravit scénář' : 'Edit Scenario'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteScenarioConfirmId(scenario.id);
                    }}
                    className="p-2 hover:bg-rose-900/30 rounded-lg transition-all text-slate-400 hover:text-rose-500"
                    title={t.delete_scenario}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
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
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCharacter(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold text-white transition-colors shadow-lg shadow-rose-900/20"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Scenario Confirmation Overlay */}
      {deleteScenarioConfirmId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
            <p className="text-sm font-medium text-slate-200">
              {t.confirm_delete.replace('{name}', scenarios.find(s => s.id === deleteScenarioConfirmId)?.title || '')}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button 
                onClick={() => setDeleteScenarioConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteScenario(deleteScenarioConfirmId);
                  setDeleteScenarioConfirmId(null);
                }}
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
    </>
  );
};
