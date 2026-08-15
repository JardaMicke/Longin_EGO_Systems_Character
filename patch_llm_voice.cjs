const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

code = code.replace(
  'export const playVoice = async (text: string, settings: AppSettings) => {',
  'export const playVoice = async (text: string, settings: AppSettings, customVoiceName?: string) => {'
);

code = code.replace(
  'voiceName: settings.voiceName || \'Kore\',',
  'voiceName: customVoiceName || settings.voiceName || \'Kore\','
);

fs.writeFileSync('llmService.ts', code);
console.log("llmService.ts patched for customVoiceName");
