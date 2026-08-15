const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const ragQueryCode = `
const searchRagContext = async (query: string, characterId: string): Promise<string> => {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(\`\${backendUrl}/api/rag/search\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, character_id: characterId, top_k: 3 })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results.map((r: any) => \`[Context from \${r.source}]: \${r.text}\`).join('\\n');
      }
    }
  } catch (e) {
    console.error("RAG search failed:", e);
  }
  return "";
};
`;

if (!code.includes("searchRagContext")) {
  code = code.replace(
    "export const callLLM = async (",
    ragQueryCode + "\nexport const callLLM = async ("
  );
}

const originalMemoryContext = "const finalPrompt = `${systemContext}\\n\\n[HISTORY]\\n${historyContext}\\n\\nUSER: ${userInput}`;";

const updatedMemoryContext = `
    const ragContext = await searchRagContext(userInput, character.id);
    const finalPrompt = \`\${systemContext}\\n\\n\${ragContext ? '[RETRIEVED KNOWLEDGE]\\n' + ragContext + '\\n\\n' : ''}[HISTORY]\\n\${historyContext}\\n\\nUSER: \${userInput}\`;
`;

if (code.includes(originalMemoryContext)) {
  code = code.replace(originalMemoryContext, updatedMemoryContext);
  fs.writeFileSync('llmService.ts', code);
  console.log("llmService.ts patched for RAG");
} else {
  console.log("Could not find memory context line in llmService.ts");
}
