const fs = require('fs');
let code = fs.readFileSync('components/VideoGenDialog.tsx', 'utf8');

code = code.replace(
  'const [prompt, setPrompt] = useState(initialPrompt);',
  'const [prompt, setPrompt] = useState(initialPrompt);\n  const [useConsistentCharacter, setUseConsistentCharacter] = useState(false);\n  const [photorealisticBoost, setPhotorealisticBoost] = useState(false);'
);

code = code.replace(
  "onClick={() => setParams({...params, useConsistentCharacter: true, photorealisticBoost: true, resolution: '1080p'})}",
  "onClick={() => { setUseConsistentCharacter(true); setPhotorealisticBoost(true); }}"
);

code = code.replace(
  "params.photorealisticBoost && params.useConsistentCharacter",
  "photorealisticBoost && useConsistentCharacter"
);

code = code.replace(
  "onClick={() => setParams({...params, useConsistentCharacter: false, photorealisticBoost: false, resolution: '720p'})}",
  "onClick={() => { setUseConsistentCharacter(false); setPhotorealisticBoost(false); }}"
);

code = code.replace(
  "!params.photorealisticBoost && !params.useConsistentCharacter",
  "!photorealisticBoost && !useConsistentCharacter"
);

// We must also pass these down to onConfirm when the user hits 'Generate'
code = code.replace(
  "onConfirm({ prompt, aspectRatio: selectedTemplate.aspectRatio, resolution: selectedTemplate.resolution, segments: 1 })",
  "onConfirm({ prompt, aspectRatio: selectedTemplate.aspectRatio, resolution: selectedTemplate.resolution, segments: 1, useConsistentCharacter, photorealisticBoost })"
);

fs.writeFileSync('components/VideoGenDialog.tsx', code);
console.log("VideoGenDialog.tsx patched");
