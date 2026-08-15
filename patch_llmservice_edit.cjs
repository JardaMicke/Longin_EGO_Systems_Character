const fs = require('fs');
let code = fs.readFileSync('llmService.ts', 'utf8');

const editImageFunc = `
export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const model = 'gemini-3.1-flash-image';
  
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  for (const part of (response.candidates?.[0]?.content?.parts || [])) {
    if (part.inlineData) {
      return \`data:\${part.inlineData.mimeType || 'image/png'};base64,\${part.inlineData.data}\`;
    }
  }

  throw new Error("No image generated");
};
`;

code = code + '\n' + editImageFunc;
fs.writeFileSync('llmService.ts', code);
console.log("llmService.ts patched with editImage");
