
import React from 'react';
import { AppSettings, LLMProvider, AppLanguage, VoiceEffect, VoiceAccent } from '../types';
import { translations } from '../locales';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = React.useState<AppSettings>(settings);
  const [showAgeVerification, setShowAgeVerification] = React.useState(false);
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = React.useState(false);
  const [modelFetchError, setModelFetchError] = React.useState('');

  React.useEffect(() => {
    if (formData.provider === 'ollama') {
      setIsFetchingModels(true);
      setModelFetchError('');
      const baseUrl = formData.ollamaUrl.replace(/\/$/, '');
      fetch(`${baseUrl}/api/tags`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then(data => {
          if (data && data.models) {
            setAvailableModels(data.models.map((m: any) => m.name));
            if (data.models.length > 0 && (!formData.ollamaModel || !data.models.some((m: any) => m.name === formData.ollamaModel))) {
              setFormData(prev => ({ ...prev, ollamaModel: data.models[0].name }));
            }
          } else {
            setAvailableModels([]);
          }
        })
        .catch(err => {
          setModelFetchError('Connection failed. Is Ollama running?');
          setAvailableModels([]);
        })
        .finally(() => setIsFetchingModels(false));
    } else if (formData.provider === 'lmstudio') {
      setIsFetchingModels(true);
      setModelFetchError('');
      const baseUrl = formData.lmStudioUrl.replace(/\/$/, '');
      fetch(`${baseUrl}/models`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then(data => {
          if (data && data.data) {
            setAvailableModels(data.data.map((m: any) => m.id));
            if (data.data.length > 0 && (!formData.lmStudioModel || !data.data.some((m: any) => m.id === formData.lmStudioModel))) {
              setFormData(prev => ({ ...prev, lmStudioModel: data.data[0].id }));
            }
          } else {
            setAvailableModels([]);
          }
        })
        .catch(err => {
          setModelFetchError('Connection failed. Is LM Studio running?');
          setAvailableModels([]);
        })
        .finally(() => setIsFetchingModels(false));
    } else {
      setAvailableModels([]);
    }
  }, [formData.provider, formData.ollamaUrl, formData.lmStudioUrl]);

    const [downloadProgress, setDownloadProgress] = React.useState<Record<string, number>>({});
  
  const startModelDownload = async (url: string, type: string, filename: string) => {
    try {
      const taskId = `${type}_${filename}`;
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/models/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, model_type: type, filename })
      });
      const data = await res.json();
      
      if (data.status === 'exists') {
        setDownloadProgress(prev => ({ ...prev, [taskId]: 100 }));
        return;
      }
      
      // Start polling
      const poll = setInterval(async () => {
        try {
          const pRes = await fetch(`${backendUrl}/api/models/download/${taskId}`);
          const pData = await pRes.json();
          setDownloadProgress(prev => ({ ...prev, [taskId]: pData.progress }));
          
          if (pData.progress === 100 || pData.progress === -1) {
            clearInterval(poll);
          }
        } catch (e) {
          clearInterval(poll);
        }
      }, 2000);
      
    } catch (e) {
      console.error('Download start failed:', e);
    }
  };

  const t = translations[formData.language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleNsfwToggle = (enabled: boolean) => {
    if (enabled && !formData.isAgeVerified) {
      setShowAgeVerification(true);
    } else {
      setFormData({ ...formData, isNsfwEnabled: enabled });
    }
  };

  const confirmAge = () => {
    setFormData({ ...formData, isNsfwEnabled: true, isAgeVerified: true });
    setShowAgeVerification(false);
  };

  const handleDownloadInstaller = () => {
    const batContent = `
@echo off
setlocal

echo Zvolte slozku pro instalaci (otevre se dialogove okno)...
set "psCommand=\"(new-object -COM 'Shell.Application').BrowseForFolder(0,'Vyberte slozku pro instalaci',0,0).self.path\""
for /f "delims=" %%I in ('powershell %psCommand%') do set "INSTALL_DIR=%%I"

if "%INSTALL_DIR%"=="" (
    echo Nebyla vybrana zadna slozka, instalace ukoncena.
    pause
    exit /b
)

set "TARGET_DIR=%INSTALL_DIR%\\CompanionAI_Backend"

echo ==============================================
echo Companion AI Local Backend Installer (Windows)
echo ==============================================
echo.
echo Tento skript pripravi slozku %TARGET_DIR%
echo a stahne:
echo 1) Pinokio (AI Prohlizec pro jednoduse stahovane AI apps)
echo 2) ComfyUI (Pro generovani medii)
echo 3) Ollama (Pro lokalni jazykove modely)
echo.
pause
echo.

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
cd /d "%TARGET_DIR%"

echo [1/3] Stahuji Pinokio... (Pinokio umi samo nainstalovat ComfyUI i s workflows)
curl -L -o pinokio_installer.exe "https://github.com/pinokiocomputer/pinokio/releases/latest/download/Pinokio-Setup.exe"

echo [2/3] Stahuji Ollama v2...
curl -L -o OllamaSetup.exe "https://ollama.com/download/OllamaSetup.exe"

echo ==============================================
echo ZAKLAD STAZEN do %TARGET_DIR%\
echo.
echo DALSIM KROKEM JE:
echo 1) Spustit OllamaSetup.exe a nainstalovat si Llama3 nebo jiny model (ollama run llama3)
echo 2) Spustit pinokio_installer.exe, nechat ho nainstalovat se do vasi slozky a z nej si na 1 kliknuti pridat ComfyUI.
echo 3) Az ComfyUI a Ollama pobezi, staci do \"Nastaveni\" v 
echo teto aplikaci zadat url k Ollama a url k ComfyUI.
echo ==============================================
pause
`;
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'companion_backend_install.bat';
    link.click();
    URL.revokeObjectURL(url);
  };

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
  const accents: { id: VoiceAccent; label: string }[] = [
    { id: 'neutral', label: t.accent_neutral },
    { id: 'american', label: t.accent_american },
    { id: 'british', label: t.accent_british },
    { id: 'australian', label: t.accent_australian },
    { id: 'indian', label: t.accent_indian },
  ];
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


          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Global Instructions (Behavioral Overrides)</label>
            <p className="text-[10px] text-slate-500 mb-2">These instructions will be appended to every character's system prompt.</p>
            <textarea 
              className="w-full bg-slate-800 border-none rounded-lg p-2.5 focus:ring-1 focus:ring-pink-500 resize-y min-h-[80px] text-sm text-slate-300"
              placeholder="e.g., Always speak in a polite tone. Never use emojis."
              value={formData.globalInstructions || ''}
              onChange={e => setFormData({...formData, globalInstructions: e.target.value})}
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
                  <div className="w-full">
                    {isFetchingModels ? (
                      <div className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-slate-400">Loading models...</div>
                    ) : modelFetchError ? (
                      <div className="space-y-2">
                        <div className="w-full bg-red-900/20 border border-red-500/50 rounded-lg p-2.5 text-red-400 text-sm">
                          {modelFetchError}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Model Name (llama3)"
                          className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                          value={formData.ollamaModel}
                          onChange={e => setFormData({...formData, ollamaModel: e.target.value})}
                        />
                      </div>
                    ) : availableModels.length > 0 ? (
                      <select
                        className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-white"
                        value={formData.ollamaModel}
                        onChange={e => setFormData({...formData, ollamaModel: e.target.value})}
                      >
                        {availableModels.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Model Name (llama3)"
                        className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                        value={formData.ollamaModel}
                        onChange={e => setFormData({...formData, ollamaModel: e.target.value})}
                      />
                    )}
                  </div>
                </>
              )}

              {formData.provider === 'lmstudio' && (
                <>
                  <input 
                    type="text" 
                    placeholder="Endpoint (http://localhost:1234/v1)"
                    className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                    value={formData.lmStudioUrl}
                    onChange={e => setFormData({...formData, lmStudioUrl: e.target.value})}
                  />
                  <div className="w-full mt-2">
                    {isFetchingModels ? (
                      <div className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-slate-400">Loading models...</div>
                    ) : modelFetchError ? (
                      <div className="space-y-2">
                        <div className="w-full bg-red-900/20 border border-red-500/50 rounded-lg p-2.5 text-red-400 text-sm">
                          {modelFetchError}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Model ID"
                          className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-white"
                          value={formData.lmStudioModel || ''}
                          onChange={e => setFormData({...formData, lmStudioModel: e.target.value})}
                        />
                      </div>
                    ) : availableModels.length > 0 ? (
                      <select
                        className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-white"
                        value={formData.lmStudioModel || ''}
                        onChange={e => setFormData({...formData, lmStudioModel: e.target.value})}
                      >
                        {availableModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Model ID (Wait for load or type manual)"
                        className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-white"
                        value={formData.lmStudioModel || ''}
                        onChange={e => setFormData({...formData, lmStudioModel: e.target.value})}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 p-4 bg-emerald-900/10 rounded-xl border border-emerald-900/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-emerald-400">{(t as any).local_backend}</h4>
                  <p className="text-xs text-slate-400 mt-1">{(t as any).installer_desc}</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleDownloadInstaller}
                  className="whitespace-nowrap px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-emerald-900/20"
                >
                  {(t as any).download_installer}
                </button>
              </div>

                {/* ControlNet Model */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-800 rounded-xl mt-4">
                  <div className="mb-3 sm:mb-0">
                    <h4 className="text-white font-medium">ControlNet Canny (SDXL)</h4>
                    <p className="text-xs text-slate-400">sai_xl_canny_256lora.safetensors (~700 MB)</p>
                    {downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] !== undefined && (
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-1.5 rounded-full ${downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === -1 ? 'bg-red-500' : downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.max(0, downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'])}%` }}
                        ></div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                           {downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === 100 ? 'Installed' : 
                            downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === -1 ? 'Failed' : 
                            `Downloading: ${downloadProgress['controlnet_sai_xl_canny_256lora.safetensors']}%`}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => startModelDownload(
                      'https://huggingface.co/lllyasviel/sd_control_collection/resolve/main/sai_xl_canny_256lora.safetensors',
                      'controlnet',
                      'sai_xl_canny_256lora.safetensors'
                    )}
                    disabled={downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === 100 || (downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] > 0 && downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] < 100)}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === 100 ? 'Installed' : 'Download'}
                  </button>
                </div>

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
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">{t.voice_accent}</label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {accents.map(acc => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setFormData({...formData, voiceAccent: acc.id})}
                        className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                          (formData.voiceAccent || 'neutral') === acc.id 
                            ? 'bg-emerald-600 border-emerald-500 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                  
                  {(formData.voiceAccent && formData.voiceAccent !== 'neutral') && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                       <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">{t.accent_strength}</label>
                        <span className="text-xs font-bold text-emerald-500">{formData.voiceAccentStrength || 1.0}x</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="2.0" step="0.1"
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        value={formData.voiceAccentStrength || 1.0}
                        onChange={e => setFormData({...formData, voiceAccentStrength: parseFloat(e.target.value)})}
                      />
                    </div>
                  )}
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
                  onChange={e => handleNsfwToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>
            {formData.isNsfwEnabled && !formData.isAgeVerified && (
              <p className="text-[10px] text-red-500 font-bold px-2">{t.age_required}</p>
            )}

            {formData.isNsfwEnabled && (
              <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-pink-900/20 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">{t.nsfw_model}</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-pink-500 outline-none transition-colors"
                    value={formData.nsfwModel}
                    onChange={e => setFormData({...formData, nsfwModel: e.target.value})}
                    placeholder="e.g. dolphin-llama3:8b"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{t.nsfw_model_desc}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">{t.sd_url}</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-pink-500 outline-none transition-colors"
                    value={formData.stableDiffusionUrl}
                    onChange={e => setFormData({...formData, stableDiffusionUrl: e.target.value})}
                    placeholder="http://localhost:7860"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{t.sd_url_desc}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">{t.comfy_url}</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-pink-500 outline-none transition-colors"
                    value={formData.comfyUIUrl}
                    onChange={e => setFormData({...formData, comfyUIUrl: e.target.value})}
                    placeholder="http://127.0.0.1:8188"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">{t.comfy_url_desc}</p>
                </div>
              </div>
            )}
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

        {/* Age Verification Modal */}
        {showAgeVerification && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
            <div className="bg-slate-900 border border-pink-500/30 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl shadow-pink-500/10">
              <div className="w-16 h-16 bg-pink-600/20 rounded-full flex items-center justify-center text-pink-500 mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{t.age_verification_title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{t.age_verification_desc}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmAge}
                  className="w-full bg-pink-600 hover:bg-pink-500 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-pink-900/20"
                >
                  {t.confirm_age}
                </button>
                <button 
                  onClick={() => setShowAgeVerification(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-slate-400 transition-all"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
