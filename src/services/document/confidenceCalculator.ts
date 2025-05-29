
import type { SearchResult } from './types';

export class ConfidenceCalculator {
  // Calculate confidence score based on search results and similarity
  calculateConfidence(searchResults: SearchResult, sources: string[]): number {
    if (!searchResults.chunks.length) {
      return 30; // Low confidence when no relevant documents found
    }

    let confidence = 40; // Base confidence

    // Factor 1: Average similarity score (40% weight)
    if (searchResults.avgSimilarity) {
      confidence += Math.min(searchResults.avgSimilarity * 40, 40);
    }

    // Factor 2: Number of sources (20% weight)
    const sourceBonus = Math.min(sources.length * 5, 20);
    confidence += sourceBonus;

    // Factor 3: Quality of sources (bonus for official sources)
    const officialSourceBonus = sources.filter(source => 
      source.includes('jogtar.hu') || 
      source.includes('eur-lex.europa.eu') || 
      source.includes('mekh.hu') ||
      source.includes('magyarkozlony.hu')
    ).length * 3;
    
    confidence = Math.min(confidence + officialSourceBonus, 95);
    
    return Math.max(confidence, 30); // Minimum 30% confidence
  }
}

export const confidenceCalculator = new ConfidenceCalculator();
