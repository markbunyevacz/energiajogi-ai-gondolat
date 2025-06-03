import { aiAgentRouter } from '../aiAgentRouter';
import { extractTextFromPDF } from '../aiAgentRouter';
import optimizedDocumentService from '../optimizedDocumentService';
import { ContractAnalysisError, ErrorCodes } from '@/types/errors';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DocumentType = Database['public']['Enums']['document_type'];
type RiskLevel = Database['public']['Enums']['risk_level'];
type RiskType = Database['public']['Enums']['risk_type'];

export interface LegalAnalysisResult {
  risk: RiskLevel;
  suggestions: string[];
  fileName: string;
  analysisType: string;
  notes?: string;
  confidence: number;
  processingTime: number;
}

export class LegalAnalysisService {
  private documentService: typeof optimizedDocumentService;

  constructor() {
    this.documentService = optimizedDocumentService;
  }

  async analyzeDocument(
    file: File,
    analysisType: string,
    notes?: string
  ): Promise<LegalAnalysisResult> {
    const startTime = performance.now();
    
    try {
      // 1. Extract text from document
      const documentText = await extractTextFromPDF(file);
      
      // 2. Analyze with AI
      const [risks, improvements] = await Promise.all([
        aiAgentRouter.highlightRisksOrMissingElements(documentText),
        aiAgentRouter.suggestImprovementsOrComplianceChecks(documentText)
      ]);

      // 3. Calculate confidence based on document analysis
      const confidence = this.calculateConfidence(risks, improvements);

      // 4. Store analysis in database
      await this.storeAnalysis({
        fileName: file.name,
        analysisType,
        notes,
        risks,
        improvements,
        confidence
      });

      // 5. Return formatted result
      return {
        risk: this.determineRiskLevel(risks),
        suggestions: this.formatSuggestions(improvements),
        fileName: file.name,
        analysisType,
        notes,
        confidence,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      console.error('Error in legal analysis:', error);
      throw new ContractAnalysisError(
        'Hiba történt a jogi elemzés során.',
        ErrorCodes.CONTRACT_ANALYSIS_ERROR,
        'error',
        { originalError: error }
      );
    }
  }

  private calculateConfidence(risks: string, improvements: string): number {
    // Implement confidence calculation based on analysis quality
    const riskCount = risks.split('\n').filter(line => line.trim()).length;
    const improvementCount = improvements.split('\n').filter(line => line.trim()).length;
    
    // More detailed analysis = higher confidence
    const baseConfidence = Math.min((riskCount + improvementCount) / 10, 1);
    
    // Adjust based on analysis quality
    const qualityScore = this.assessAnalysisQuality(risks, improvements);
    
    return Math.min(baseConfidence * qualityScore, 1);
  }

  private assessAnalysisQuality(risks: string, improvements: string): number {
    // Implement quality assessment logic
    const hasSpecificRisks = risks.includes('kockázat') || risks.includes('hiányzó');
    const hasSpecificImprovements = improvements.includes('javaslat') || improvements.includes('ajánlott');
    
    return hasSpecificRisks && hasSpecificImprovements ? 1 : 0.7;
  }

  private determineRiskLevel(risks: string): RiskLevel {
    const riskCount = risks.split('\n').filter(line => line.trim()).length;
    
    if (riskCount > 5) return 'high';
    if (riskCount > 2) return 'medium';
    return 'low';
  }

  private formatSuggestions(improvements: string): string[] {
    return improvements
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').trim());
  }

  private async storeAnalysis(data: {
    fileName: string;
    analysisType: string;
    notes?: string;
    risks: string;
    improvements: string;
    confidence: number;
  }): Promise<void> {
    // Start transaction
    const { data: transaction, error: transactionError } = await supabase.rpc('begin_transaction');
    
    if (transactionError) {
      throw new ContractAnalysisError(
        'Nem sikerült elindítani a tranzakciót',
        ErrorCodes.TRANSACTION_ERROR,
        'error',
        { originalError: transactionError }
      );
    }

    try {
      // First, create a document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          title: data.fileName,
          type: 'szerződés' as DocumentType,
          metadata: {
            notes: data.notes,
            confidence: data.confidence
          }
        })
        .select()
        .single();

      if (docError) {
        await supabase.rpc('rollback_transaction');
        throw new ContractAnalysisError(
          'Hiba a dokumentum létrehozásakor',
          ErrorCodes.DOCUMENT_CREATION_ERROR,
          'error',
          { originalError: docError }
        );
      }

      // Then create the analysis record
      const { error: analysisError } = await supabase
        .from('contract_analyses')
        .insert({
          contract_id: document.id,
          risk_level: this.determineRiskLevel(data.risks),
          summary: data.notes,
          recommendations: this.formatSuggestions(data.improvements)
        });

      if (analysisError) {
        await supabase.rpc('rollback_transaction');
        throw new ContractAnalysisError(
          'Hiba az elemzés mentésekor',
          ErrorCodes.ANALYSIS_SAVE_ERROR,
          'error',
          { originalError: analysisError }
        );
      }

      // Finally, create risk records in parallel
      const risks = data.risks.split('\n').filter(line => line.trim());
      const riskPromises = risks.map(risk => 
        supabase
          .from('risks')
          .insert({
            type: 'legal' as RiskType,
            severity: this.determineRiskLevel(data.risks),
            description: risk,
            recommendation: this.formatSuggestions(data.improvements)[0]
          })
      );

      const riskResults = await Promise.all(riskPromises);
      const riskErrors = riskResults.filter(result => result.error);

      if (riskErrors.length > 0) {
        await supabase.rpc('rollback_transaction');
        throw new ContractAnalysisError(
          'Hiba a kockázatok mentésekor',
          ErrorCodes.RISK_SAVE_ERROR,
          'error',
          { originalError: riskErrors[0].error }
        );
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        await supabase.rpc('rollback_transaction');
        throw new ContractAnalysisError(
          'Hiba a tranzakció véglegesítésekor',
          ErrorCodes.TRANSACTION_COMMIT_ERROR,
          'error',
          { originalError: commitError }
        );
      }

    } catch (error) {
      // Rollback transaction on any error
      await supabase.rpc('rollback_transaction');
      
      if (error instanceof ContractAnalysisError) {
        throw error;
      }
      
      throw new ContractAnalysisError(
        'Váratlan hiba történt az elemzés mentésekor',
        ErrorCodes.UNKNOWN_ERROR,
        'error',
        { originalError: error }
      );
    }
  }
}

export const legalAnalysisService = new LegalAnalysisService(); 