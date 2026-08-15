const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

// Insert import for db
if (!code.includes("import { db } from './db';")) {
  code = "import { db } from './db';\n" + code;
}

const originalCallLLM = `export const callLLM = async (
  settings: AppSettings,
  character: Character,
  history: Message[],
  userInput: string,
  mode: ChatMode = 'conversation'
): Promise<{ text: string; toolCalls?: any[] }> => {
  const quirks = character.personalityQuirks?.length ? \` Personality quirks: \${character.personalityQuirks.join(', ')}.\` : '';`;

const newCallLLM = `export const callLLM = async (
  settings: AppSettings,
  character: Character,
  history: Message[],
  userInput: string,
  mode: ChatMode = 'conversation'
): Promise<{ text: string; toolCalls?: any[] }> => {
  
  // Fetch Memory Graph Events from Neo4j Semantica backend
  let memoryContext = '';
  try {
    const memoryData = await db.getCharacterMemory(character.id);
    if (memoryData && memoryData.events && memoryData.events.length > 0) {
      // Get last 15 relevant memory events
      const recentEvents = memoryData.events.slice(0, 15).reverse();
      memoryContext = '\\n\\nGRAPH MEMORY & PAST EVENTS:\\n' + recentEvents.map(e => \`[\${new Date(e.timestamp).toLocaleString()}] \${e.text}\`).join('\\n');
    }
  } catch (e) {
    console.error('Failed to load Neo4j memory context', e);
  }

  const quirks = character.personalityQuirks?.length ? \` Personality quirks: \${character.personalityQuirks.join(', ')}.\` : '';`;

code = code.replace(originalCallLLM, newCallLLM);

const originalSystemContext = `  const systemContext = \`
    IDENTITY: You are \${character.name}. Role: \${character.description}.
    PERSONALITY: \${character.personality}.\${quirks}\${backstory}`;

const newSystemContext = `  const systemContext = \`
    IDENTITY: You are \${character.name}. Role: \${character.description}.
    PERSONALITY: \${character.personality}.\${quirks}\${backstory}\${memoryContext}`;

code = code.replace(originalSystemContext, newSystemContext);

fs.writeFileSync('llmService.ts', code);
