const fs = require('fs');
let code = fs.readFileSync('db.ts', 'utf8');

const apiHelpers = `
const getApiUrl = () => {
  return window.location.protocol + '//' + window.location.hostname + ':8000/api';
};

// API Helpers for Semantica/Neo4j Backend
const backendApi = {
  syncCharacter: async (char) => {
    try {
      await fetch(getApiUrl() + '/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: char.id,
          name: char.name,
          description: char.description || char.personality || ''
        })
      });
    } catch (e) {
      console.error('Failed to sync character to Neo4j:', e);
    }
  },
  saveMemoryEvent: async (characterId, text, timestamp) => {
    try {
      await fetch(getApiUrl() + '/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: characterId,
          event_text: text,
          timestamp: timestamp
        })
      });
    } catch (e) {
      console.error('Failed to save memory event to Neo4j:', e);
    }
  },
  getCharacterMemory: async (characterId) => {
    try {
      const res = await fetch(getApiUrl() + '/memory/' + characterId);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch memory from Neo4j:', e);
    }
    return { events: [] };
  }
};
`;

// Insert apiHelpers after DEFAULT_CHARACTERS
code = code.replace("export const defaultSettings", apiHelpers + "\nexport const defaultSettings");

// Modify saveCharacters to sync to backend
const originalSaveChars = `  saveCharacters: async (chars: Character[]) => {
    await localforage.setItem(STORAGE_KEYS.CHARACTERS, chars);
  },`;
const newSaveChars = `  saveCharacters: async (chars: Character[]) => {
    await localforage.setItem(STORAGE_KEYS.CHARACTERS, chars);
    // Sync to Semantica backend
    for (const char of chars) {
      await backendApi.syncCharacter(char);
    }
  },`;
code = code.replace(originalSaveChars, newSaveChars);

// Modify saveChat to sync new messages
const originalSaveChat = `  saveChat: async (characterId: string, session: ChatSession) => {
    const chats = await db.getChats();
    chats[characterId] = session;
    await localforage.setItem(STORAGE_KEYS.CHATS, chats);
  },`;
const newSaveChat = `  saveChat: async (characterId: string, session: ChatSession) => {
    const chats = await db.getChats();
    const oldSession = chats[characterId];
    chats[characterId] = session;
    await localforage.setItem(STORAGE_KEYS.CHATS, chats);

    // Find new messages to save as events in Neo4j memory
    const newMessages = session.messages;
    const oldMessagesCount = oldSession ? oldSession.messages.length : 0;
    
    if (newMessages.length > oldMessagesCount) {
      for (let i = oldMessagesCount; i < newMessages.length; i++) {
        const msg = newMessages[i];
        if (msg.type === 'text' || msg.type === 'narration') {
            await backendApi.saveMemoryEvent(
                characterId, 
                \`\${msg.role === 'user' ? 'User' : 'Character'}: \${msg.content}\`,
                msg.timestamp
            );
        }
      }
    }
  },
  getCharacterMemory: backendApi.getCharacterMemory,`;
code = code.replace(originalSaveChat, newSaveChat);

fs.writeFileSync('db.ts', code);
