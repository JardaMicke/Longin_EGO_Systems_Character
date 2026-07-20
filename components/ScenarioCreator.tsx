
import React, { useState } from 'react';
import { Character, AppLanguage, Scenario, InteractionRule } from '../types';
import { translations } from '../locales';
import { suggestScenarioTags } from '../llmService';
import { db } from '../db';

interface ScenarioCreatorProps {
  characters: Character[];
  language: AppLanguage;
  onSave: (scenario: Scenario) => void;
  onClose: () => void;
  initialScenario?: Scenario;
}

export const ScenarioCreator: React.FC<ScenarioCreatorProps> = ({
  characters,
  language,
  onSave,
  onClose,
  initialScenario
}) => {
  const t = translations[language] as any;
  const [title, setTitle] = useState(initialScenario?.title || '');
  const [description, setDescription] = useState(initialScenario?.description || '');
  const [userRole, setUserRole] = useState(initialScenario?.userRole || '');
  const [initialSituation, setInitialSituation] = useState(initialScenario?.initialSituation || '');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>(initialScenario?.characterIds || []);
  const [duration, setDuration] = useState(initialScenario?.duration || 30);
  const [interactionRule, setInteractionRule] = useState<InteractionRule>(initialScenario?.interactionRule || 'cooperative');
  const [tags, setTags] = useState<string[]>(initialScenario?.tags || []);
  const [tagsInput, setTagsInput] = useState('');
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const toggleCharacter = (id: string) => {
    setSelectedCharIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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

  const handleSuggestTags = async () => {
    if (!title || !description) return;
    setIsSuggestingTags(true);
    const settings = await db.getSettings();
    const suggested = await suggestScenarioTags(title, description, settings);
    if (suggested && suggested.length > 0) {
      const newTags = new Set([...tags, ...suggested]);
      setTags(Array.from(newTags));
    }
    setIsSuggestingTags(false);
  };

  const handleSave = () => {
    if (!title || !description || selectedCharIds.length === 0) return;

    const newScenario: Scenario = {
      id: initialScenario ? initialScenario.id : Date.now().toString(),
      title,
      description,
      characterIds: selectedCharIds,
      userRole,
      initialSituation,
      duration,
      interactionRule,
      tags,
      lastUpdated: Date.now()
    };

    onSave(newScenario);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">{t.new_scenario}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              {t.scenario_title}
              <span className="text-pink-500">*</span>
            </label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              placeholder="e.g. Mystery at the Mansion"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.scenario_desc}</label>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button type="button" onClick={() => document.execCommand('bold')} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors font-bold">B</button>
                <button type="button" onClick={() => document.execCommand('italic')} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors italic">I</button>
                <button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>
            <div 
              contentEditable
              dangerouslySetInnerHTML={{ __html: description }}
              onBlur={e => setDescription((e.target as HTMLDivElement).innerHTML)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all min-h-[150px] leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500"
              data-placeholder="Describe the overall context using rich formatting..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.user_role}</label>
              <input 
                value={userRole}
                onChange={e => setUserRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                placeholder="e.g. Detective"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.select_characters}</label>
              <div className="flex flex-wrap gap-2">
                {characters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => toggleCharacter(char.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                      selectedCharIds.includes(char.id)
                        ? 'bg-pink-600 border-pink-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <img src={char.avatar || undefined} className="w-5 h-5 rounded-full object-cover" alt="" />
                    <span className="text-xs font-medium">{char.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.scene_duration}</label>
              <input 
                type="number"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                min="1"
                max="240"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.interaction_rules}</label>
              <div className="relative">
                <select 
                  value={interactionRule}
                  onChange={e => setInteractionRule(e.target.value as InteractionRule)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all appearance-none pr-10"
                >
                  <option value="cooperative">{t.rule_cooperative}</option>
                  <option value="competitive">{t.rule_competitive}</option>
                  <option value="independent">{t.rule_independent}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.initial_situation}</label>
            <textarea 
              value={initialSituation}
              onChange={e => setInitialSituation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all h-32 resize-none"
              placeholder="How does the story begin?"
            />
          </div>

          <div className="space-y-3 bg-slate-800/30 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.tags || 'Tags'}</label>
              <button 
                type="button" 
                onClick={handleSuggestTags}
                disabled={isSuggestingTags || !title || !description}
                className="text-[10px] font-black uppercase tracking-widest text-pink-500 hover:text-pink-400 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSuggestingTags ? (
                  <div className="w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                {t.auto_suggest || 'Auto Suggest'}
              </button>
            </div>
            <div className="flex gap-4">
              <input 
                value={tagsInput} 
                onChange={e => setTagsInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} 
                placeholder={t.add_tag || 'Add a tag...'} 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all" 
              />
              <button 
                type="button" 
                onClick={addTag} 
                className="px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all"
              >
                {t.add || 'Add'}
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-pink-500/20">
                    {tag} 
                    <button onClick={() => removeTag(i)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={!title || !description || selectedCharIds.length === 0}
            className="flex-[2] py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-900/20"
          >
            {t.create_scenario}
          </button>
        </div>
      </div>
    </div>
  );
};
