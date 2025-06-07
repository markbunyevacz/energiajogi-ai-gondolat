import { BaseAgent, AgentConfig, AgentContext, AgentResult } from '../base-agents/BaseAgent';
import { EmbeddingService } from '../../embedding/EmbeddingService';
import { ImpactAnalyzer } from '../../citation-graph/ImpactAnalyzer';
import { LegalDocument } from '../../legal-domains/types';
import { supabase } from '../../../integrations/supabase/client';

export interface CrossDomainImpact {
    sourceDocument: LegalDocument;
    impactedDocument: LegalDocument;
    impactChain: string[];
    riskScore: number;
    domain: string;
}

export class CrossDomainImpactAnalyzer extends BaseAgent {
    private embeddingService: EmbeddingService;
    private impactAnalyzer: ImpactAnalyzer;

    constructor(config: AgentConfig) {
        super(config);
        this.embeddingService = new EmbeddingService();
        this.impactAnalyzer = new ImpactAnalyzer(supabase);
    }

    public async initialize(): Promise<void> {
        await super.updateConfig(this.config);
    }

    public async process(context: AgentContext): Promise<AgentResult> {
        if (!context.document.content) {
            return {
                success: false,
                message: "Document content is empty.",
            };
        }

        try {
            // 1. Get embedding for the document content
            const embedding = await this.embeddingService.getEmbedding(context.document.content);

            // 2. Find similar documents across domains
            // We need to adjust the call to findSimilarDocuments to search across domains.
            // This might require a modification in the EmbeddingService or the underlying Supabase function.
            // For now, let's assume it finds documents and we filter by domain.
            const similarDocuments: any[] = await this.embeddingService.findSimilarDocuments(embedding, 0.8, 10);

            const crossDomainImpacts: CrossDomainImpact[] = [];

            for (const similarDoc of similarDocuments) {
                if (similarDoc.metadata.domain !== context.document.metadata.domain) {
                    // 3. Analyze impact chain for each cross-domain document
                    const impactChains: any[] = await this.impactAnalyzer.analyzeImpact(similarDoc.id);

                    // 4. Calculate risk score and create impact object
                    for (const chain of impactChains) {
                        const riskScore = this.calculateRiskScore(chain.impact_path.length, similarDoc.metadata.importance);
                        
                        const impactedDoc: LegalDocument = {
                            id: similarDoc.id,
                            title: similarDoc.title,
                            content: similarDoc.content,
                            documentType: similarDoc.documentType,
                            domainId: similarDoc.metadata.domain,
                            metadata: similarDoc.metadata,
                        };

                        crossDomainImpacts.push({
                            sourceDocument: context.document,
                            impactedDocument: impactedDoc,
                            impactChain: chain.impact_path,
                            riskScore,
                            domain: similarDoc.metadata.domain,
                        });
                    }
                }
            }

            const visualization = this.getImpactChainVisualization(crossDomainImpacts);

            return {
                success: true,
                message: 'Cross-domain impact analysis completed.',
                data: {
                    impacts: crossDomainImpacts,
                    visualization,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error during cross-domain impact analysis.',
                error: error as Error,
            };
        }
    }

    private calculateRiskScore(impactChainLength: number, documentImportance: number = 1): number {
        // More sophisticated risk scoring can be implemented
        const baseScore = 1 / impactChainLength;
        return baseScore * documentImportance;
    }

    private getImpactChainVisualization(impacts: CrossDomainImpact[]): string {
        if (impacts.length === 0) {
            return '';
        }

        let mermaidString = 'graph TD;\n';
        const nodes = new Set<string>();

        for (const impact of impacts) {
            const sourceId = impact.sourceDocument.id.replace(/-/g, '');
            const impactedId = impact.impactedDocument.id.replace(/-/g, '');

            if (!nodes.has(sourceId)) {
                mermaidString += `    ${sourceId}["${impact.sourceDocument.title}"]\n`;
                nodes.add(sourceId);
            }
            if (!nodes.has(impactedId)) {
                mermaidString += `    ${impactedId}["${impact.impactedDocument.title}"]\n`;
                nodes.add(impactedId);
            }

            mermaidString += `    ${sourceId} -->|cross-domain| ${impactedId};\n`;

            // Add impact chain to visualization
            for (let i = 0; i < impact.impactChain.length - 1; i++) {
                const from = impact.impactChain[i].replace(/-/g, '');
                const to = impact.impactChain[i+1].replace(/-/g, '');
                if (!nodes.has(from)) {
                    mermaidString += `    ${from}["Document ${from.substring(0, 8)}"]\n`;
                    nodes.add(from);
                }
                if (!nodes.has(to)) {
                    mermaidString += `    ${to}["Document ${to.substring(0, 8)}"]\n`;
                    nodes.add(to);
                }
                mermaidString += `    ${from} --> ${to};\n`;
            }
        }

        return mermaidString;
    }
} 