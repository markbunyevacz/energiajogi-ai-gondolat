import { ImpactChain, CitationRelationship, ImpactLevel } from './types';
import { CitationError } from './errors';
import { SupabaseClient } from '@supabase/supabase-js';

export class ImpactAnalyzer {
  constructor(private readonly supabase: SupabaseClient) {}

  async analyzeImpact(documentId: string): Promise<ImpactChain[]> {
    const visited = new Set<string>();
    const impactChains: ImpactChain[] = [];
    
    await this.traverseImpactChain(documentId, visited, impactChains);
    return impactChains;
  }

  private async traverseImpactChain(
    documentId: string,
    visited: Set<string>,
    chains: ImpactChain[],
    currentPath: string[] = []
  ): Promise<void> {
    if (visited.has(documentId)) return;
    visited.add(documentId);

    const citations = await this.getCitations(documentId);
    const newPath = [...currentPath, documentId];

    for (const citation of citations) {
      const impactLevel = this.calculateImpactLevel(newPath.length);
      chains.push({
        id: crypto.randomUUID(),
        root_document_id: newPath[0],
        affected_document_id: citation.target_document_id,
        impact_path: newPath,
        impact_level: impactLevel
      });

      await this.traverseImpactChain(
        citation.target_document_id,
        visited,
        chains,
        newPath
      );
    }
  }

  private calculateImpactLevel(depth: number): ImpactLevel {
    if (depth === 1) return 'direct';
    if (depth <= 3) return 'indirect';
    return 'potential';
  }

  private async getCitations(documentId: string): Promise<CitationRelationship[]> {
    const { data, error } = await this.supabase
      .from('citation_relationships')
      .select('*')
      .eq('source_document_id', documentId);
    
    if (error) {
      throw new CitationError(
        'Failed to fetch citations',
        'FETCH_FAILED',
        'error',
        true,
        { documentId, error }
      );
    }
    
    return data as CitationRelationship[];
  }
} 