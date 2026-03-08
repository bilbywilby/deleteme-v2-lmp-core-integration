/**
 * Port of semantic_engine.py logic to TypeScript.
 * Implements mock vector embeddings and similarity search for LMP context.
 */
export class SemanticEngine {
  /**
   * Generates a deterministic mock embedding for a string.
   * Maps an input string to a fixed-size vector of floats.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const vectorSize = 32;
    const embedding: number[] = new Array(vectorSize).fill(0);
    // Deterministic seed generation from string
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    // Pseudo-random deterministic vector based on hash
    for (let i = 0; i < vectorSize; i++) {
      const seed = Math.sin(hash + i) * 10000;
      embedding[i] = seed - Math.floor(seed);
    }
    // Normalize vector (L2 norm)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  static cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0;
    let dotProduct = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
    }
    // Since our generateEmbedding returns normalized vectors, dot product is cosine similarity
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
  static async findSimilarSuccessfulEmails<T extends { content: string; type: string }>(
    context: string,
    history: T[]
  ): Promise<T[]> {
    // Only look for successes (mocked by type check or metadata)
    const successes = history.filter(h => h.type === 'email_sent' || h.type === 'draft_generated');
    const results = await this.similaritySearch(context, successes, h => h.content, 0.7);
    return results.map(r => r.item);
  }
  static clusterPatterns(items: string[]): string[][] {
    // Basic mock clustering for pattern grouping
    const clusters: string[][] = [];
    const processed = new Set<number>();
    for (let i = 0; i < items.length; i++) {
      if (processed.has(i)) continue;
      const currentCluster = [items[i]];
      processed.add(i);
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(j)) continue;
        // Mock distance check
        if (items[i].length % 5 === items[j].length % 5) {
          currentCluster.push(items[j]);
          processed.add(j);
        }
      }
      clusters.push(currentCluster);
    }
    return clusters;
  }
}