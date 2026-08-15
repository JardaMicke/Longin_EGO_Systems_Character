const fs = require('fs');
let code = fs.readFileSync('components/Settings.tsx', 'utf8');

const newUIState = `  const [downloadProgress, setDownloadProgress] = React.useState<Record<string, number>>({});
  
  const startModelDownload = async (url: string, type: string, filename: string) => {
    try {
      const taskId = \`\${type}_\${filename}\`;
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(\`\${backendUrl}/api/models/download\`, {
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
          const pRes = await fetch(\`\${backendUrl}/api/models/download/\${taskId}\`);
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
`;

if (!code.includes("const [downloadProgress")) {
  code = code.replace("const t = translations[formData.language];", newUIState + "\n  const t = translations[formData.language];");
}

const uiHtml = `
            {/* MODEL MANAGER FOR COMFYUI */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">ComfyUI Model Manager</h3>
              <p className="text-sm text-slate-400 mb-4">
                Automated model downloader. Models are saved to <code className="bg-slate-800 px-1 rounded">./local_disk/models/</code>. 
                <strong>Crucial:</strong> You must configure your local ComfyUI's <code className="bg-slate-800 px-1 rounded">extra_model_paths.yaml</code> to point to this directory to see them!
              </p>
              
              <div className="space-y-4">
                {/* AnimateDiff Model */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-800 rounded-xl">
                  <div className="mb-3 sm:mb-0">
                    <h4 className="text-white font-medium">AnimateDiff V3 (Video)</h4>
                    <p className="text-xs text-slate-400">mm_sd_v15_v3.safetensors (~1.8 GB)</p>
                    {downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] !== undefined && (
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div 
                          className={\`h-1.5 rounded-full \${downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] === -1 ? 'bg-red-500' : downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] === 100 ? 'bg-emerald-500' : 'bg-blue-500'}\`} 
                          style={{ width: \`\${Math.max(0, downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'])}%\` }}
                        ></div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                           {downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] === 100 ? 'Installed' : 
                            downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] === -1 ? 'Failed' : 
                            \`Downloading: \${downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors']}%\`}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => startModelDownload(
                      'https://huggingface.co/guoyww/animatediff/resolve/main/v3_sd15_mm.ckpt',
                      'animatediff_models',
                      'mm_sd_v15_v3.safetensors'
                    )}
                    disabled={downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] === 100 || (downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] > 0 && downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] < 100)}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {downloadProgress['animatediff_models_mm_sd_v15_v3.safetensors'] === 100 ? 'Installed' : 'Download'}
                  </button>
                </div>
              </div>
            </div>
`;

if (!code.includes("ComfyUI Model Manager")) {
  code = code.replace("{/* Voice Settings */}", uiHtml + "\n\n            {/* Voice Settings */}");
}

fs.writeFileSync('components/Settings.tsx', code);
console.log('Settings UI Patched for Downloader.');
