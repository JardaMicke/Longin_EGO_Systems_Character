const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  'if (settings.voiceEnabled) playVoice(result.text, settings);',
  'if (settings.voiceEnabled) playVoice(result.text, settings, selectedChar?.voiceName);'
);

code = code.replace(
  'if (settings.voiceEnabled) playVoice(result.text, settings);',
  'if (settings.voiceEnabled) playVoice(result.text, settings, "Puck");' // Scenario fallback
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched for custom voice");
