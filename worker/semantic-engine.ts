/**
 * Port of semantic_engine.py logic to TypeScript.
 * Implements mock vector embeddings and similarity search for LMP context.
 */
export class SemanticEngine {
  /**
   * Generates a stable hash from session metadata to detect context drift.
   */
  static generateContextHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `LMP-${Math.abs(hash).toString(16)}`;
  }
  /**
   * Validates version conflicts for CAS operations.
   */
  static validateVersionConflict(currentV: number, incomingV: number): { conflict: boolean; resolution?: string } {
    if (currentV !== incomingV) {
      return { 
        conflict: true, 
        resolution: `Incoming version ${incomingV} lags behind current state ${currentV}. Please pull remote buffers.`
      };
    }
    return { conflict: false };
  }
  /**
   * Generates a deterministic mock embedding for a string.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const vectorSize = 32;
    const embedding: number[] = new Array(vectorSize).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    // Sensitivity adjustment for high-value keywords
    const keywords = ['gdpr', 'ccpa', 'erasure', 'delete', 'privacy', 'right to be forgotten'];
    const lowerText = text.toLowerCase();
    const keywordBoost = keywords.some(k => lowerText.includes(k)) ? 1.2 : 1.0;
    for (let i = 0; i < vectorSize; i++) {
      const seed = Math.sin(hash + i) * 10000;
      embedding[i] = (seed - Math.floor(seed)) * keywordBoost;
    }
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }
  static cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0;
    let dotProduct = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
    }
    return Math.max(0, Math.min(1, dotProduct));
  }
  static async similaritySearch<T>(
    query: string,
    items: T[],
    getText: (item: T) => string,
    threshold: number = 0.85
  ): Promise<{ item: T; score: number }[]> {
    const queryVec = await this.generateEmbedding(query);
    const results = await Promise.all(items.map(async (item) => {
      const itemVec = await this.generateEmbedding(getText(item));
      const score = this.cosineSimilarity(queryVec, itemVec);
      return { item, score };
    }));
    return results
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }
}