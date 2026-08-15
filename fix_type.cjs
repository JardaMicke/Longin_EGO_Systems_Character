const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');
code = code.replace(
  '  onMoodChange?: (mood: string, reason: string) => void;',
  "  onMoodChange?: (mood: 'happy' | 'sad' | 'energetic' | 'calm' | 'angry' | 'mysterious' | 'seductive', reason: string) => void;"
);
fs.writeFileSync('components/ChatWindow.tsx', code);

let appCode = fs.readFileSync('App.tsx', 'utf8');
appCode = appCode.replace(
  'onMoodChange={(mood, reason) => {',
  "onMoodChange={(mood: any, reason: string) => {"
);
fs.writeFileSync('App.tsx', appCode);
