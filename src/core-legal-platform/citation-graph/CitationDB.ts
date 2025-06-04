import { SupabaseClient } from '@supabase/supabase-js';
import { Graph } from './Graph';

export class CitationDB {
  constructor(private readonly supabase: SupabaseClient) {}

  async storeGraph(graph: Graph): Promise<void> {
    const graphData = graph.toJSON();
    const { error } = await this.supabase
      .from('citation_graphs')
      .insert([{ 
        graph_data: graphData,
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      throw new Error(`Failed to store citation graph: ${error.message}`);
    }
  }
  
  async findDocumentByCitation(citation: string): Promise<string | null> {
    // First try exact match
    let { data, error } = await this.supabase
      .from('documents')
      .select('id')
      .eq('normalized_citation', citation)
      .single();
    
    if (data) return data.id;
    
    // Then try array search for multiple citations
    ({ data, error } = await this.supabase
      .from('documents')
      .select('id')
      .contains('normalized_citations', [citation])
      .single());
    
    if (data) return data.id;
    
    // Finally try fuzzy match
    ({ data, error } = await this.supabase
      .from('documents')
      .select('id')
      .textSearch('normalized_citations', citation)
      .single());
    
    return data?.id || null;
  }

  async createIndexes(): Promise<void> {
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_citation_graphs_gin ON citation_graphs USING gin (graph_data);`,
      `CREATE INDEX IF NOT EXISTS idx_documents_citations ON documents USING gin (normalized_citations);`,
      `CREATE INDEX IF NOT EXISTS idx_documents_citation ON documents (normalized_citation);`,
      `CREATE INDEX IF NOT EXISTS idx_citation_edges_source ON citation_edges (source_document_id);`,
      `CREATE INDEX IF NOT EXISTS idx_citation_edges_target ON citation_edges (target_document_id);`,
      `CREATE INDEX IF NOT EXISTS idx_citation_edges_type ON citation_edges (citation_type);`
    ];

    for (const query of indexQueries) {
      const { error } = await this.supabase.rpc('execute_sql', { query });
      if (error) {
        console.warn(`Failed to create index: ${error.message}`);
      }
    }
  }

  async getDocumentStats(documentId: string): Promise<{
    incomingCitations: number;
    outgoingCitations: number;
    explicitCitations: number;
    implicitCitations: number;
  }> {
    const [incoming, outgoing] = await Promise.all([
      this.supabase
        .from('citation_edges')
        .select('citation_type')
        .eq('target_document_id', documentId),
      this.supabase
        .from('citation_edges')
        .select('citation_type')
        .eq('source_document_id', documentId)
    ]);

    const incomingData = incoming.data || [];
    const outgoingData = outgoing.data || [];

    return {
      incomingCitations: incomingData.length,
      outgoingCitations: outgoingData.length,
      explicitCitations: [...incomingData, ...outgoingData]
        .filter(edge => edge.citation_type === 'explicit').length,
      implicitCitations: [...incomingData, ...outgoingData]
        .filter(edge => edge.citation_type === 'implicit').length
    };
  }
} 