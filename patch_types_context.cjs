const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

const contextMediaDef = `
export interface ContextMedia {
  id: string;
  type: 'image' | 'video' | 'text';
  data: string;
  mimeType?: string;
  name?: string;
}
`;

code = code.replace(
  'export interface CharacterProfile {',
  contextMediaDef + '\nexport interface CharacterProfile {'
);

code = code.replace(
  '  profile?: CharacterProfile;',
  '  profile?: CharacterProfile;\n  contextMedia?: ContextMedia[];'
);

fs.writeFileSync('types.ts', code);
console.log("types.ts patched with ContextMedia");
