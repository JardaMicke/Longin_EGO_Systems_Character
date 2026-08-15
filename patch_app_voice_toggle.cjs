const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const voiceToggleProps = `
          isVoiceEnabled={settings.voiceEnabled}
          onToggleVoice={() => {
            const newSettings = { ...settings, voiceEnabled: !settings.voiceEnabled };
            setSettings(newSettings);
            db.saveSettings(newSettings);
          }}
`;

code = code.replace(
  '          onMoodChange={(mood, reason) => {',
  voiceToggleProps + '          onMoodChange={(mood, reason) => {'
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched with voice toggle props");
