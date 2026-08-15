const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const onMoodChangeProp = `
          onMoodChange={(mood, reason) => {
            if (selectedChar) {
              setCharacters(prev => {
                const newChars = prev.map(c => {
                  if (c.id === selectedChar.id) {
                    const moodMem = { mood, timestamp: Date.now(), reason };
                    return { ...c, mood, moodHistory: [...(c.moodHistory || []), moodMem] };
                  }
                  return c;
                });
                db.saveCharacters(newChars);
                return newChars;
              });
              setStatusMessage(\`Manuální změna nálady: \${mood}\`);
              if (settings.moodSoundEnabled) playUISound('mood', settings.uiVolume);
            }
          }}
`;

code = code.replace(
  '          statusMessage={statusMessage}',
  '          statusMessage={statusMessage}\\n' + onMoodChangeProp
);

fs.writeFileSync('App.tsx', code);
console.log("App.tsx patched with onMoodChange");
