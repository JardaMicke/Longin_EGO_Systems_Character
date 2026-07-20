const fs = require('fs');
const files = [
  'components/ProfileView.tsx',
  'components/CharacterCreator.tsx',
  'components/ScenarioCreator.tsx',
  'components/ChatWindow.tsx',
  'components/Sidebar.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/src=\{character\.avatar\}/g, 'src={character.avatar || undefined}');
  content = content.replace(/src=\{char\.avatar\}/g, 'src={char.avatar || undefined}');
  content = content.replace(/src=\{avatar\}/g, 'src={avatar || undefined}');
  content = content.replace(/src=\{images\[selectedImageIndex\]\}/g, 'src={images[selectedImageIndex] || undefined}');
  content = content.replace(/src=\{img\}/g, 'src={img || undefined}');
  content = content.replace(/src=\{msg\.content\}/g, 'src={msg.content || undefined}');
  fs.writeFileSync(file, content);
});
console.log('Fixed src attributes');
