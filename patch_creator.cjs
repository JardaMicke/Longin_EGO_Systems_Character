const fs = require('fs');
let code = fs.readFileSync('components/CharacterCreator.tsx', 'utf8');

code = code.replace(
  "import { Character, BodySpecs, FaceSpecs, AppLanguage, CharacterMood } from '../types';",
  "import { Character, BodySpecs, FaceSpecs, AppLanguage, CharacterMood, ContextMedia } from '../types';"
);

code = code.replace(
  "const [uploadedPhotos, setUploadedPhotos] = useState<{data: string, mimeType: string}[]>([]);",
  "const [contextMedia, setContextMedia] = useState<ContextMedia[]>([]);"
);

// Replace handlePhotoUpload logic
code = code.replace(
  /const handlePhotoUpload = [\s\S]*?const handleAnalyzePhotos/m,
`const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newMedia: ContextMedia[] = [];
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const result = evt.target?.result as string;
          let base64 = result;
          if (result.includes(',')) base64 = result.split(',')[1];
          let type: 'image' | 'video' | 'text' = 'text';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';
          
          newMedia.push({ 
            id: Date.now().toString() + Math.random().toString(),
            type, 
            data: base64, 
            mimeType: file.type,
            name: file.name
          });
          if (newMedia.length === e.target.files!.length) {
            setContextMedia(prev => [...prev, ...newMedia]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMedia = (id: string) => {
    setContextMedia(prev => prev.filter(m => m.id !== id));
  };

  const handleAnalyzePhotos`
);

// Update analyze logic to only use images
code = code.replace(
  "if (uploadedPhotos.length === 0) return;",
  "const images = contextMedia.filter(m => m.type === 'image');\n    if (images.length === 0) return;"
);

code = code.replace(
  "const imageParts = uploadedPhotos.map(p => ({",
  "const imageParts = images.map(p => ({"
);

code = code.replace(
  "if (uploadedPhotos.length > 0) {",
  "if (images.length > 0) {"
);

code = code.replace(
  "setAvatar(\`data:\${uploadedPhotos[0].mimeType};base64,\${uploadedPhotos[0].data}\`);",
  "setAvatar(\`data:\${images[0].mimeType};base64,\${images[0].data}\`);"
);

// Add to handleSave
code = code.replace(
  "tags: tags,",
  "tags: tags,\n      contextMedia,"
);

fs.writeFileSync('components/CharacterCreator.tsx', code);
console.log("CharacterCreator.tsx base logic patched");
