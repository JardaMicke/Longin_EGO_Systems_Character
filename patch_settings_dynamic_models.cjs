const fs = require('fs');
let code = fs.readFileSync('components/Settings.tsx', 'utf8');

const oldUseEffect = `  React.useEffect(() => {
    if (formData.provider === 'ollama') {
      setIsFetchingModels(true);
      setModelFetchError('');
      // Use clean URL without trailing slash
      const baseUrl = formData.ollamaUrl.replace(/\\/$/, '');
      fetch(\`\${baseUrl}/api/tags\`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then(data => {
          if (data && data.models) {
            setAvailableModels(data.models.map((m: any) => m.name));
            // Auto-select first model if none is set or current is not in list
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
    }
  }, [formData.provider, formData.ollamaUrl]);`;

const newUseEffect = `  React.useEffect(() => {
    if (formData.provider === 'ollama') {
      setIsFetchingModels(true);
      setModelFetchError('');
      const baseUrl = formData.ollamaUrl.replace(/\\/$/, '');
      fetch(\`\${baseUrl}/api/tags\`)
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
      const baseUrl = formData.lmStudioUrl.replace(/\\/$/, '');
      fetch(\`\${baseUrl}/models\`)
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
  }, [formData.provider, formData.ollamaUrl, formData.lmStudioUrl]);`;

code = code.replace(oldUseEffect, newUseEffect);

const oldLmStudioHtml = `              {formData.provider === 'lmstudio' && (
                 <input 
                    type="text" 
                    placeholder="Endpoint (http://localhost:1234/v1)"
                    className="w-full bg-slate-800 border-none rounded-lg p-2.5"
                    value={formData.lmStudioUrl}
                    onChange={e => setFormData({...formData, lmStudioUrl: e.target.value})}
                  />
              )}`;

const newLmStudioHtml = `              {formData.provider === 'lmstudio' && (
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
              )}`;

code = code.replace(oldLmStudioHtml, newLmStudioHtml);

fs.writeFileSync('components/Settings.tsx', code);
console.log("Patched Settings.tsx successfully.");
