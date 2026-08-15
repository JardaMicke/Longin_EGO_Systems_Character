const fs = require('fs');
let code = fs.readFileSync('components/Settings.tsx', 'utf8');

const controlnetHtml = `
                {/* ControlNet Model */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-800 rounded-xl mt-4">
                  <div className="mb-3 sm:mb-0">
                    <h4 className="text-white font-medium">ControlNet Canny (SDXL)</h4>
                    <p className="text-xs text-slate-400">sai_xl_canny_256lora.safetensors (~700 MB)</p>
                    {downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] !== undefined && (
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div 
                          className={\`h-1.5 rounded-full \${downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === -1 ? 'bg-red-500' : downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === 100 ? 'bg-emerald-500' : 'bg-blue-500'}\`} 
                          style={{ width: \`\${Math.max(0, downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'])}%\` }}
                        ></div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                           {downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === 100 ? 'Installed' : 
                            downloadProgress['controlnet_sai_xl_canny_256lora.safetensors'] === -1 ? 'Failed' : 
                            \`Downloading: \${downloadProgress['controlnet_sai_xl_canny_256lora.safetensors']}%\`}
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
`;

if (!code.includes("ControlNet Canny (SDXL)")) {
  code = code.replace("</div>\n            </div>", "</div>\n" + controlnetHtml + "\n            </div>");
  fs.writeFileSync('components/Settings.tsx', code);
  console.log('Settings UI Patched for ControlNet Downloader.');
}
