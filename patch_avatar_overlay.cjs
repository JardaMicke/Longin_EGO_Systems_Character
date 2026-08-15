const fs = require('fs');
let code = fs.readFileSync('components/ChatWindow.tsx', 'utf8');

const getMoodOverlay = `
  const getMoodOverlay = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-yellow-400/40 shadow-[inset_0_0_15px_rgba(250,204,21,0.5)]';
      case 'sad': return 'bg-blue-500/40 shadow-[inset_0_0_15px_rgba(59,130,246,0.5)]';
      case 'energetic': return 'bg-orange-500/40 shadow-[inset_0_0_15px_rgba(249,115,22,0.5)] animate-pulse';
      case 'calm': return 'bg-teal-400/40 shadow-[inset_0_0_15px_rgba(45,212,191,0.5)]';
      case 'angry': return 'bg-red-500/50 shadow-[inset_0_0_15px_rgba(239,68,68,0.7)] animate-pulse';
      case 'mysterious': return 'bg-purple-500/40 shadow-[inset_0_0_15px_rgba(168,85,247,0.5)]';
      case 'seductive': return 'bg-rose-500/40 shadow-[inset_0_0_15px_rgba(244,63,94,0.5)]';
      default: return 'bg-white/10';
    }
  };
  const moodOverlay = getMoodOverlay(currentMood);
`;

code = code.replace(
  "const currentMood = character.mood || 'happy';",
  "const currentMood = character.mood || 'happy';\\n" + getMoodOverlay
);

const avatarReplacement = `
        <div className="relative group cursor-pointer w-12 h-12">
          <img 
            src={character.avatar || undefined} 
            alt={character.name} 
            className={\`w-full h-full rounded-full object-cover ring-2 ring-pink-500/30 transition-all group-hover:ring-pink-500 shadow-xl \${idleAnim}\`} 
          />
          <div className={\`absolute inset-0 rounded-full mix-blend-overlay pointer-events-none transition-all duration-1000 \${moodOverlay}\`}></div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
        </div>
`;

// Looking at the original:
// <div className="relative group cursor-pointer">
//   <img 
//     src={character.avatar || undefined} 
//     alt={character.name} 
//     className={`w-12 h-12 rounded-full object-cover ring-2 ring-pink-500/30 transition-all group-hover:ring-pink-500 shadow-xl ${idleAnim}`} 
//   />
//   <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
// </div>

const originalAvatar = /<div className="relative group cursor-pointer">\s*<img\s*src=\{character\.avatar \|\| undefined\}\s*alt=\{character\.name\}\s*className=\{`w-12 h-12 rounded-full object-cover ring-2 ring-pink-500\/30 transition-all group-hover:ring-pink-500 shadow-xl \$\{idleAnim\}`\}\s*\/>\s*<div className="absolute -bottom-0\.5 -right-0\.5 w-4 h-4 bg-green-500 border-2 border-black rounded-full"><\/div>\s*<\/div>/;

if (originalAvatar.test(code)) {
    code = code.replace(originalAvatar, avatarReplacement.trim());
    fs.writeFileSync('components/ChatWindow.tsx', code);
    console.log("ChatWindow.tsx patched successfully");
} else {
    console.log("Regex didn't match. Here is the actual code around avatar:");
    console.log(code.substring(code.indexOf('character.avatar') - 200, code.indexOf('character.avatar') + 200));
}
