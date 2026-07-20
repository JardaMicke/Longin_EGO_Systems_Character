const fs = require('fs');
let dbContent = fs.readFileSync('db.ts', 'utf8');

const replacement = `
  getSettings: async (): Promise<AppSettings> => {
    try {
      const data = await localforage.getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
      if (data) {
        // Sanitize legacy or invalid gemini models
        if (data.geminiModel && data.geminiModel.includes('gemini-3-flash-preview')) {
          data.geminiModel = 'gemini-3.5-flash';
        }
        if (data.geminiModel && data.geminiModel.includes('gemini-2.5-flash-latest')) {
          data.geminiModel = 'gemini-3.5-flash';
        }
        return { ...defaultSettings, ...data };
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  },`;

dbContent = dbContent.replace(/getSettings: async \(\): Promise<AppSettings> => \{[\s\S]*?return defaultSettings;\s*\}\s*\},/, replacement.trim() + ',');
fs.writeFileSync('db.ts', dbContent);
