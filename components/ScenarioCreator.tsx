
import React, { useState } from 'react';
import { Character, AppLanguage, Scenario, InteractionRule } from '../types';
import { translations } from '../locales';

interface ScenarioCreatorProps {
  characters: Character[];
  language: AppLanguage;
  onSave: (scenario: Scenario) => void;
  onClose: () => void;
}

export const ScenarioCreator: React.FC<ScenarioCreatorProps> = ({
  characters,
  language,
  onSave,
  onClose
}) => {
  const t = translations[language] as any;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userRole, setUserRole] = useState('');
  const [initialSituation, setInitialSituation] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [duration, setDuration] = useState(30);
  const [interactionRule, setInteractionRule] = useState<InteractionRule>('cooperative');

  const toggleCharacter = (id: string) => {
    setSelectedCharIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!title || !description || selectedCharIds.length === 0) return;

    const newScenario: Scenario = {
      id: Date.now().toString(),
      title,
      description,
      characterIds: selectedCharIds,
      userRole,
      initialSituation,
      duration,
      interactionRule,
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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.scenario_desc}</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all h-24 resize-none"
              placeholder="Describe the overall context..."
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
                    <img src={char.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
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
