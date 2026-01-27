
import React from 'react';
import { AppSettings, LLMProvider, AppLanguage, VoiceEffect } from '../types';
import { translations } from '../locales';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = React.useState<AppSettings>(settings);
  const t = translations[formData.language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
  const effects: { id: VoiceEffect; label: string }[] = [
    { id: 'none', label: t.effect_none },
    { id: 'echo', label: t.effect_echo },
    { id: 'reverb', label: t.effect_reverb },
    { id: 'radio', label: t.effect_radio },
    { id: 'robotic', label: t.effect_robotic },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t.settings}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{t.language}</label>
            <div className="flex gap-2">
              {(['cs', 'en'] as AppLanguage[]).map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFormData({...formData, language: lang})}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    formData.language === lang 
                      ? 'bg-pink-600 border-pink-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {lang === 'cs' ? 'Čeština' : 'English'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.your_name}</label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border-none rounded-lg p-2.5 focus:ring-1 focus:ring-pink-500"
              value={formData.userName}
              onChange={e => setFormData({...formData, userName: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 mb-3">{t.model_provider}</h3>
            <select 
              className="w-full bg-slate-800 border-none rounded-lg p-2.5 mb-4"
              value={formData.provider}
              onChange={e => setFormData({...formData, provider: e.target.value as LLMProvider})}
            >
              <option value="gemini">Gemini (Built-in)</option>
              <option value="openai">OpenAI API</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="lmstudio">LM Studio (Local)</option>
            </select>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 space-y-4">
              {formData.provider === 'openai' && (
                <>
                  <input 
                    type="password" 
                    placeholder="OpenAI API Key"
                    className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                    value={formData.openaiKey}
                    onChange={e => setFormData({...formData, openaiKey: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Model Name (gpt-4o)"
                    className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                    value={formData.openaiModel}
                    onChange={e => setFormData({...formData, openaiModel: e.target.value})}
                  />
                </>
              )}

              {formData.provider === 'ollama' && (
                <>
                  <input 
                    type="text" 
                    placeholder="URL (http://localhost:11434)"
                    className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                    value={formData.ollamaUrl}
                    onChange={e => setFormData({...formData, ollamaUrl: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Model Name (llama3)"
                    className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                    value={formData.ollamaModel}
                    onChange={e => setFormData({...formData, ollamaModel: e.target.value})}
                  />
                </>
              )}

              {formData.provider === 'lmstudio' && (
                 <input 
                    type="text" 
                    placeholder="Endpoint (http://localhost:1234/v1)"
                    className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                    value={formData.lmStudioUrl}
                    onChange={e => setFormData({...formData, lmStudioUrl: e.target.value})}
                  />
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-300">{t.voice_assistant}</h3>
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800">
              <div>
                <p className="font-semibold text-slate-200">{t.enable_voice}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t.speech_speed}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.voiceEnabled}
                  onChange={e => setFormData({...formData, voiceEnabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            {formData.voiceEnabled && (
              <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">{t.voice_selection}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {voices.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormData({...formData, voiceName: v})}
                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                          formData.voiceName === v 
                            ? 'bg-pink-600 border-pink-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">{t.speech_speed}</label>
                      <span className="text-xs font-bold text-pink-500">{formData.voiceSpeed}x</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1"
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-600"
                      value={formData.voiceSpeed}
                      onChange={e => setFormData({...formData, voiceSpeed: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">{t.speech_pitch}</label>
                      <span className="text-xs font-bold text-indigo-500">{formData.voicePitch}x</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1"
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      value={formData.voicePitch}
                      onChange={e => setFormData({...formData, voicePitch: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">{t.voice_effect}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {effects.map(eff => (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => setFormData({...formData, voiceEffect: eff.id})}
                        className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                          formData.voiceEffect === eff.id 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {eff.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-4">
             <div className="flex items-center justify-between p-4 bg-pink-900/10 rounded-xl border border-pink-900/30">
              <div>
                <p className="font-semibold text-pink-200">{t.nsfw_content}</p>
                <p className="text-xs text-slate-500">{t.explicit_roleplay}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.isNsfwEnabled}
                  onChange={e => setFormData({...formData, isNsfwEnabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl transition-colors font-medium"
            >
              {t.cancel}
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-pink-600 hover:bg-pink-500 py-2.5 rounded-xl transition-colors font-semibold shadow-lg shadow-pink-900/20"
            >
              {t.save_settings}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
