
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, GroundingSource } from "../types";

export interface StreamResult {
  text: string;
  groundingSources: GroundingSource[];
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize GoogleGenAI strictly following the guideline: new GoogleGenAI({ apiKey: process.env.API_KEY })
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async sendMessageStream(
    history: ChatMessage[],
    message: string,
    image?: { mimeType: string, data: string },
    onChunk?: (text: string) => void
  ): Promise<StreamResult> {
    const modelName = 'gemini-3-flash-preview';
    
    const contents = history.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(p => {
        if (p.text) return { text: p.text };
        if (p.inlineData) return { inlineData: p.inlineData };
        return { text: '' };
      })
    }));

    const currentParts: any[] = [{ text: message }];
    if (image) {
      currentParts.push({ inlineData: image });
    }
    
    contents.push({ role: 'user', parts: currentParts });

    try {
      const useSearch = !image; 

      const result = await this.ai.models.generateContentStream({
        model: modelName,
        contents,
        config: {
          tools: useSearch ? [{ googleSearch: {} }] : undefined,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      let fullText = "";
      let groundingMetadata: any = null;
      
      // result is returned as an AsyncGenerator in this context and does not expose a .response property.
      // We accumulate text and capture any available grounding metadata during iteration.
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          if (onChunk) onChunk(text);
        }
        
        // Extract grounding metadata if it's included in the response chunk
        if (chunk.candidates?.[0]?.groundingMetadata) {
          groundingMetadata = chunk.candidates[0].groundingMetadata;
        }
      }

      // Metadata is extracted from the accumulated chunks above.
      const sources: GroundingSource[] = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || chunk.maps?.title || "Search Result",
        uri: chunk.web?.uri || chunk.maps?.uri || "#"
      })).filter((s: GroundingSource) => s.uri !== "#") || [];

      return {
        text: fullText,
        groundingSources: sources
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
