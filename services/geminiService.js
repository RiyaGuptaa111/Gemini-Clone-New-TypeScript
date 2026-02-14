import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async sendMessageStream(history, message, image, onChunk) {
    const modelName = "gemini-3-flash-preview";

    const contents = history.map((msg) => ({
      role: msg.role,
      parts: msg.parts.map((p) => {
        if (p.text) return { text: p.text };
        if (p.inlineData) return { inlineData: p.inlineData };
        return { text: "" };
      }),
    }));

    const currentParts = [{ text: message }];
    if (image) {
      currentParts.push({ inlineData: image });
    }

    contents.push({ role: "user", parts: currentParts });

    try {
      const useSearch = !image;

      const result = await this.ai.models.generateContentStream({
        model: modelName,
        contents,
        config: {
          tools: useSearch ? [{ googleSearch: {} }] : undefined,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      let fullText = "";
      let groundingMetadata = null;

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          if (onChunk) onChunk(text);
        }

        if (chunk.candidates?.[0]?.groundingMetadata) {
          groundingMetadata = chunk.candidates[0].groundingMetadata;
        }
      }

      const sources =
        groundingMetadata?.groundingChunks
          ?.map((chunk) => ({
            title:
              chunk.web?.title ||
              chunk.maps?.title ||
              "Search Result",
            uri: chunk.web?.uri || chunk.maps?.uri || "#",
          }))
          .filter((s) => s.uri !== "#") || [];

      return {
        text: fullText,
        groundingSources: sources,
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
