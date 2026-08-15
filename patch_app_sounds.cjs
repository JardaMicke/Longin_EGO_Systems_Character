const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

if (!code.includes('playUISound')) {
  code = code.replace(
    "import { translations } from './locales';",
    "import { translations } from './locales';\nimport { playUISound } from './audio';"
  );
}

// Add message sound for regular chat
code = code.replace(
  'if (settings.voiceEnabled) playVoice(result.text, settings, selectedChar?.voiceName);',
  'if (settings.voiceEnabled) playVoice(result.text, settings, selectedChar?.voiceName);\n        if (settings.messageSoundEnabled) playUISound(\'message\', settings.uiVolume);'
);

// Add mood sound
code = code.replace(
  'setStatusMessage(`${char.name} se cítí: ${newMood}`);',
  'setStatusMessage(`${char.name} se cítí: ${newMood}`);\n               if (settings.moodSoundEnabled) playUISound(\'mood\', settings.uiVolume);'
);

// Add message sound for scenario chat
code = code.replace(
  'if (settings.voiceEnabled) playVoice(result.text, settings, "Puck");',
  'if (settings.voiceEnabled) playVoice(result.text, settings, "Puck");\n        if (settings.messageSoundEnabled) playUISound(\'message\', settings.uiVolume);'
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched with ui sounds");
