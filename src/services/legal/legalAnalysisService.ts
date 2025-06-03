import { aiAgentRouter } from '../aiAgentRouter';
import { extractTextFromPDF } from '../aiAgentRouter';
import optimizedDocumentService from '../optimizedDocumentService';
import { ContractAnalysisError, ErrorCodes } from '@/types/errors';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/types/supabase';
import LRU from 'lru-cache';

type DocumentType = Database['public']['Enums']['document_type'];
type RiskLevel = Database['public']['Enums']['risk_level'];
type RiskType = Database['public']['Enums']['risk_type'];

// Optimalizált cache beállítások
const cache = new LRU<string, any>({
  max: 1000, // Növelt cache méret
  maxAge: 1000 * 60 * 30, // 30 perc
  length: (value) => {
    // A cache méretét a memóriahasználat alapján számoljuk
    return JSON.stringify(value).length;
  },
  dispose: (key, value) => {
    // Cache törléskor felszabadítjuk a memóriát
    console.log(`Cache entry removed: ${key}`);
  }
});

export interface LegalAnalysisResult {
  risk: RiskLevel;
  suggestions: string[];
  fileName: string;
  analysisType: string;
  notes?: string;
  confidence: number;
  processingTime: number;
  metrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  totalTime: number;
  textExtractionTime: number;
  chunkingTime: number;
  analysisTime: number;
  storageTime: number;
  memoryUsage: number;
  chunkCount: number;
  averageChunkSize: number;
  cacheHits: number;
  cacheMisses: number;
}

export class LegalAnalysisService {
  private documentService: typeof optimizedDocumentService;
  private readonly CHUNK_SIZE = 2000; // Optimalizált chunk méret
  private readonly BATCH_SIZE = 10; // Optimalizált batch méret
  private readonly MIN_CHUNK_SIZE = 500; // Minimális chunk méret
  private readonly MAX_CHUNK_SIZE = 4000; // Maximális chunk méret
  private cacheStats = {
    hits: 0,
    misses: 0
  };

  constructor() {
    this.documentService = optimizedDocumentService;
  }

  private chunkDocument(text: string, maxChunkSize: number = this.CHUNK_SIZE): string[] {
    // Use sentence boundaries for better context
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentWordCount = 0;
    let currentSentenceCount = 0;

    for (const sentence of sentences) {
      const sentenceWordCount = sentence.split(/\s+/).length;
      
      // Optimalizált chunk méret számítás
      const optimalChunkSize = Math.min(
        Math.max(this.MIN_CHUNK_SIZE, sentenceWordCount * 2),
        this.MAX_CHUNK_SIZE
      );
      
      if (currentWordCount + sentenceWordCount > optimalChunkSize || currentSentenceCount >= 5) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentWordCount = 0;
          currentSentenceCount = 0;
        }
        
        // Handle long sentences
        if (sentenceWordCount > optimalChunkSize) {
          const words = sentence.split(/\s+/);
          let tempChunk = '';
          let tempWordCount = 0;
          
          for (const word of words) {
            if (tempWordCount + 1 > optimalChunkSize) {
              chunks.push(tempChunk.trim());
              tempChunk = word;
              tempWordCount = 1;
            } else {
              tempChunk += (tempChunk ? ' ' : '') + word;
              tempWordCount++;
            }
          }
          
          if (tempChunk) {
            currentChunk = tempChunk;
            currentWordCount = tempWordCount;
            currentSentenceCount = 1;
          }
        } else {
          currentChunk = sentence;
          currentWordCount = sentenceWordCount;
          currentSentenceCount = 1;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentWordCount += sentenceWordCount;
        currentSentenceCount++;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private async processChunksInBatches(chunks: string[]): Promise<{ risks: string; improvements: string }[]> {
    const results: { risks: string; improvements: string }[] = [];
    
    // Process chunks in optimal batch sizes
    for (let i = 0; i < chunks.length; i += this.BATCH_SIZE) {
      const batch = chunks.slice(i, i + this.BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (chunk) => {
          const cacheKey = `chunk_${chunk.substring(0, 100)}`;
          const cached = cache.get(cacheKey);
          
          if (cached) {
            this.cacheStats.hits++;
            return cached;
          }

          this.cacheStats.misses++;
          const [risks, improvements] = await Promise.all([
            aiAgentRouter.highlightRisksOrMissingElements(chunk),
            aiAgentRouter.suggestImprovementsOrComplianceChecks(chunk)
          ]);

          const result = { risks, improvements };
          cache.set(cacheKey, result);
          return result;
        })
      );
      
      results.push(...batchResults);

      // Add small delay between batches to prevent overload
      if (i + this.BATCH_SIZE < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  private validateInput(file: File, analysisType: string): void {
    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new ContractAnalysisError(
        'Csak PDF fájlok támogatottak',
        ErrorCodes.INVALID_FILE_TYPE,
        'error'
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new ContractAnalysisError(
        'A fájl mérete nem lehet nagyobb 10MB-nál',
        ErrorCodes.FILE_TOO_LARGE,
        'error'
      );
    }

    // Validate analysis type
    const allowedAnalysisTypes = ['contract', 'policy', 'regulation'];
    if (!allowedAnalysisTypes.includes(analysisType)) {
      throw new ContractAnalysisError(
        'Érvénytelen elemzési típus',
        ErrorCodes.INVALID_ANALYSIS_TYPE,
        'error'
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
    try {
      // Use a single transaction for all database operations
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
        throw new ContractAnalysisError(
          'Hiba a dokumentum létrehozásakor',
          ErrorCodes.DOCUMENT_CREATION_ERROR,
          'error',
          { originalError: docError }
        );
      }

      // Create analysis and risks in parallel
      const [analysisResult, riskResults] = await Promise.all([
        supabase
          .from('contract_analyses')
          .insert({
            contract_id: document.id,
            risk_level: this.determineRiskLevel(data.risks),
            summary: data.notes,
            recommendations: this.formatSuggestions(data.improvements)
          }),
        Promise.all(
          data.risks
            .split('\n')
            .filter(line => line.trim())
            .map(risk => 
              supabase
                .from('risks')
                .insert({
                  type: 'legal' as RiskType,
                  severity: this.determineRiskLevel(data.risks),
                  description: risk,
                  recommendation: this.formatSuggestions(data.improvements)[0]
                })
            )
        )
      ]);

      if (analysisResult.error) {
        throw new ContractAnalysisError(
          'Hiba az elemzés mentésekor',
          ErrorCodes.ANALYSIS_SAVE_ERROR,
          'error',
          { originalError: analysisResult.error }
        );
      }

      const riskErrors = riskResults.filter(result => result.error);
      if (riskErrors.length > 0) {
        throw new ContractAnalysisError(
          'Hiba a kockázatok mentésekor',
          ErrorCodes.RISK_SAVE_ERROR,
          'error',
          { originalError: riskErrors[0].error }
        );
      }
    } catch (error) {
      if (error instanceof ContractAnalysisError) {
        throw error;
      }
      throw new ContractAnalysisError(
        'Váratlan hiba történt az elemzés mentésekor',
        ErrorCodes.CONTRACT_ANALYSIS_ERROR,
        'error',
        { originalError: error }
      );
    }
  }

  private async collectPerformanceMetrics(
    startTime: number,
    metrics: Partial<PerformanceMetrics>
  ): Promise<void> {
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    const completeMetrics = {
      totalTime,
      textExtractionTime: metrics.textExtractionTime || 0,
      chunkingTime: metrics.chunkingTime || 0,
      analysisTime: metrics.analysisTime || 0,
      storageTime: metrics.storageTime || 0,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      chunkCount: metrics.chunkCount || 0,
      averageChunkSize: metrics.averageChunkSize || 0,
      cacheHits: this.cacheStats.hits,
      cacheMisses: this.cacheStats.misses
    };

    // Store metrics in database asynchronously
    try {
      await supabase
        .from('performance_metrics')
        .insert({
          metric_type: 'contract_analysis',
          metric_value: totalTime,
          metadata: completeMetrics as unknown as Json
        });
    } catch (error: unknown) {
      console.error('Error storing performance metrics:', error);
    }

    // Reset cache stats
    this.cacheStats = { hits: 0, misses: 0 };
  }

  async analyzeDocument(
    file: File,
    analysisType: string,
    notes?: string
  ): Promise<LegalAnalysisResult> {
    const startTime = performance.now();
    const metrics: Partial<PerformanceMetrics> = {};
    
    try {
      // Validate input parameters
      this.validateInput(file, analysisType);

      // Check cache for existing analysis
      const cacheKey = `analysis_${file.name}_${file.size}`;
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // 1. Extract text from document
      const textExtractionStart = performance.now();
      const documentText = await extractTextFromPDF(file);
      metrics.textExtractionTime = performance.now() - textExtractionStart;
      
      if (!documentText || documentText.trim().length === 0) {
        throw new ContractAnalysisError(
          'A dokumentumból nem sikerült szöveget kinyerni',
          ErrorCodes.EMPTY_DOCUMENT,
          'error'
        );
      }
      
      // 2. Split document into chunks
      const chunkingStart = performance.now();
      const chunks = this.chunkDocument(documentText);
      metrics.chunkingTime = performance.now() - chunkingStart;
      metrics.chunkCount = chunks.length;
      metrics.averageChunkSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length;
      
      // 3. Analyze chunks in batches
      const analysisStart = performance.now();
      const chunkResults = await this.processChunksInBatches(chunks);
      metrics.analysisTime = performance.now() - analysisStart;

      // 4. Combine results from all chunks
      const combinedRisks = chunkResults
        .map(r => r.risks)
        .join('\n')
        .split('\n')
        .filter((r, i, a) => r.trim() && a.indexOf(r) === i);

      const combinedImprovements = chunkResults
        .map(r => r.improvements)
        .join('\n')
        .split('\n')
        .filter((r, i, a) => r.trim() && a.indexOf(r) === i);

      // 5. Calculate confidence
      const confidence = this.calculateConfidence(combinedRisks.join('\n'), combinedImprovements.join('\n'));

      // 6. Store analysis in database
      const storageStart = performance.now();
      await this.storeAnalysis({
        fileName: file.name,
        analysisType,
        notes,
        risks: combinedRisks.join('\n'),
        improvements: combinedImprovements.join('\n'),
        confidence
      });
      metrics.storageTime = performance.now() - storageStart;

      // 7. Collect and store performance metrics
      await this.collectPerformanceMetrics(startTime, metrics);

      // 8. Return formatted result
      const result = {
        risk: this.determineRiskLevel(combinedRisks.join('\n')),
        suggestions: this.formatSuggestions(combinedImprovements.join('\n')),
        fileName: file.name,
        analysisType,
        notes,
        confidence,
        processingTime: performance.now() - startTime,
        metrics: {
          totalTime: performance.now() - startTime,
          textExtractionTime: metrics.textExtractionTime || 0,
          chunkingTime: metrics.chunkingTime || 0,
          analysisTime: metrics.analysisTime || 0,
          storageTime: metrics.storageTime || 0,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          chunkCount: metrics.chunkCount || 0,
          averageChunkSize: metrics.averageChunkSize || 0,
          cacheHits: this.cacheStats.hits,
          cacheMisses: this.cacheStats.misses
        }
      };

      // Cache the result
      cache.set(cacheKey, result);
      return result;
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
}

export const legalAnalysisService = new LegalAnalysisService(); 