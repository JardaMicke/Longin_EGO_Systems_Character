const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const localMoodTool = `
  {
    type: "function",
    function: {
      name: "update_mood",
      description: "Updates the character's emotional mood based on the current context or user interaction. Call this whenever the character's feelings change significantly.",
      parameters: {
        type: "object",
        properties: {
          new_mood: { type: "string", description: "The new mood: happy, sad, energetic, calm, angry, mysterious, or seductive." },
          reason: { type: "string", description: "Short reason for this mood change based on the user's action or conversation." }
        },
        required: ["new_mood", "reason"]
      }
    }
  },
`;

code = code.replace(
  'const localTools = [',
  'const localTools = [\n' + localMoodTool
);

const geminiMoodTool = `
const moodTool: FunctionDeclaration = {
  name: "update_mood",
  parameters: {
    type: Type.OBJECT,
    description: "Updates the character's emotional mood based on the current context or user interaction. Call this whenever the character's feelings change significantly.",
    properties: {
      new_mood: { type: Type.STRING, description: "The new mood: happy, sad, energetic, calm, angry, mysterious, or seductive." },
      reason: { type: Type.STRING, description: "Short reason for this mood change." }
    },
    required: ["new_mood", "reason"]
  }
};
`;

code = code.replace(
  'const videoTool: FunctionDeclaration = {',
  geminiMoodTool + '\nconst videoTool: FunctionDeclaration = {'
);

code = code.replace(
  '        tools: [{ functionDeclarations: [imageTool, videoTool] }],',
  '        tools: [{ functionDeclarations: [imageTool, videoTool, moodTool] }],'
);

code = code.replace(
  '    3. You can GENERATE VIDEOS of yourself using \\\'generate_video\\\'.',
  '    3. You can GENERATE VIDEOS of yourself using \\\'generate_video\\\'.\n    4. You can UPDATE YOUR MOOD using \\\'update_mood\\\' if your feelings change based on the conversation.'
);

const moodHistoryInject = `
  let moodContext = '';
  if (character.moodHistory && character.moodHistory.length > 0) {
    const recentMoods = character.moodHistory.slice(-5);
    moodContext = '\\n\\nRECENT MOOD MEMORY:\\n' + recentMoods.map(m => \`[\${new Date(m.timestamp).toLocaleTimeString()}] Felt \${m.mood} because: \${m.reason}\`).join('\\n');
  }
`;

code = code.replace(
  'let knowledgeBaseContext = \'\';',
  moodHistoryInject + '\n  let knowledgeBaseContext = \'\';'
);

code = code.replace(
  '${backstory}${memoryContext}${knowledgeBaseContext}',
  '${backstory}${memoryContext}${knowledgeBaseContext}${moodContext}'
);

fs.writeFileSync('llmService.ts', code);
console.log("llmService.ts patched for update_mood tool");
