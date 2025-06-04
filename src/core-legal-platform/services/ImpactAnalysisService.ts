import { CitationGraphBuilder } from '../citation-graph/CitationGraphBuilder';

export class ImpactAnalysisService {
  constructor(private graphBuilder: CitationGraphBuilder) {}

  async getImpactChain(changedDocId: string): Promise<string[]> {
    return this.graphBuilder.getImpactChain(changedDocId);
  }
} 