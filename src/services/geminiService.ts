import { GoogleGenAI } from '@google/genai';
import { db } from './storage';
import { LocalIntelligenceEngine, LocalAnswerResult } from './localIntelligence';

export class AssistantService {
  private static geminiClient: GoogleGenAI | null = null;
  private static isHybridEnabled = false;

  public static setHybridEnabled(enabled: boolean): void {
    this.isHybridEnabled = enabled;
  }

  public static getIsHybridEnabled(): boolean {
    return this.isHybridEnabled;
  }

  private static getClient(): GoogleGenAI | null {
    if (!this.geminiClient) {
      // In Vite client, process.env or import.meta.env
      const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                     (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                     (import.meta as any).env?.GEMINI_API_KEY;
      if (apiKey) {
        this.geminiClient = new GoogleGenAI({ apiKey });
      }
    }
    return this.geminiClient;
  }

  public static async answerQuery(query: string, forceOffline = false): Promise<LocalAnswerResult & { isOffline: boolean }> {
    // 1. If user prefers offline or force offline, use local intelligence
    if (forceOffline || !this.isHybridEnabled || !navigator.onLine) {
      const offlineResult = LocalIntelligenceEngine.answerOffline(query);
      return { ...offlineResult, isOffline: true };
    }

    // 2. Try Gemini if online and hybrid enabled
    try {
      const client = this.getClient();
      if (!client) {
        const offlineResult = LocalIntelligenceEngine.answerOffline(query);
        return { ...offlineResult, isOffline: true };
      }

      const files = db.getFiles();
      const tasks = db.getTasks();
      const patterns = db.getPatterns();

      const contextSummary = `
You are Archon, an AI assistant specializing in organizing files, managing daily work, cleaning useless files, and learning user patterns.
The user is currently querying: "${query}".

Active Workspace Summary:
- Files count: ${files.length}
- Junk/Useless files count: ${files.filter(f => f.isJunk).length}
- Unorganized files: ${files.filter(f => !f.isOrganized && !f.isJunk).map(f => f.name).join(', ')}
- Pending tasks: ${tasks.filter(t => !t.completed).map(t => `${t.title} [${t.priority}]`).join('; ')}
- Learned patterns: ${patterns.map(p => `${p.title} (${Math.round(p.confidence * 100)}%)`).join('; ')}

Provide a concise, helpful, and actionable response. If files need organizing or cleaning, provide specific suggestions.
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextSummary
      });

      const responseText = response.text || '';
      if (!responseText) {
        throw new Error('Empty response');
      }

      // Also get local suggested actions
      const localResult = LocalIntelligenceEngine.answerOffline(query);

      return {
        text: responseText,
        sources: localResult.sources,
        suggestedActions: localResult.suggestedActions,
        isOffline: false
      };
    } catch (e) {
      console.warn('Gemini query fell back to offline local engine', e);
      const offlineResult = LocalIntelligenceEngine.answerOffline(query);
      return { ...offlineResult, isOffline: true };
    }
  }
}
