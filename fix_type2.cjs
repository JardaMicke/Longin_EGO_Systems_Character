const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');
code = code.replace(
  "if (onMoodChange) onMoodChange(m, customMoodReason || 'Manuálně změněno uživatelem');",
  "if (onMoodChange) onMoodChange(m as any, customMoodReason || 'Manuálně změněno uživatelem');"
);
fs.writeFileSync('components/ChatWindow.tsx', code);
