import React, { useState } from 'react';
import { ContractAnalysis, Risk } from '@/types';
import { ContractInput } from './ContractInput';
import { ContractAnalysisResults } from './ContractAnalysisResults';
import { ContractDocumentUpload } from './ContractDocumentUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ContractAnalysisError, ErrorResponse, ErrorCodes, ErrorCode } from '@/types/errors';
import { aiAgentRouter } from '@/services/aiAgentRouter';
import { ErrorHandlingService } from '@/services/errorHandlingService';

export function ContractAnalysisComponent() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [analysisResults, setAnalysisResults] = useState<ContractAnalysis[]>([]);
  const errorHandler = ErrorHandlingService.getInstance();

  const handleAnalyze = async (contractText: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Use the error handling service for risk analysis
      const risks = await errorHandler.withRetry(
        () => aiAgentRouter.highlightRisksOrMissingElements(contractText),
        ErrorCodes.RISK_ANALYSIS_FAILED,
        { contractText }
      );
      
      // Use the error handling service for improvement suggestions
      const improvements = await errorHandler.withRetry(
        () => aiAgentRouter.suggestImprovementsOrComplianceChecks(contractText),
        ErrorCodes.IMPROVEMENT_SUGGESTION_FAILED,
        { contractText }
      );
      
      const newAnalysis: ContractAnalysis = {
        id: Math.random().toString(36).substr(2, 9),
        contractId: `DEMO-${Date.now()}`,
        riskLevel: 'medium', // This should be determined by the risk analysis
        risks: parseRisksFromText(risks),
        recommendations: parseRecommendationsFromText(improvements),
        summary: 'Az AI elemzés befejeződött. A szerződés részletes áttekintése alapján azonosított kockázatok és javaslatok.',
        timestamp: new Date().toISOString()
      };
      
      setAnalysisResults(prev => [newAnalysis, ...prev]);
    } catch (err) {
      if (err instanceof ContractAnalysisError) {
        setError(errorHandler.createErrorResponse(err, { contractText }));
      } else {
        setError(errorHandler.createErrorResponse(
          new ContractAnalysisError(
            'Ismeretlen hiba történt az elemzés során.',
            ErrorCodes.CONTRACT_ANALYSIS_FAILED,
            err
          ),
          { contractText }
        ));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDocumentUpload = async (file: File, content: string) => {
    await handleAnalyze(content);
  };

  const handleRetry = async () => {
    if (error) {
      setIsAnalyzing(true);
      try {
        // Get the last contract text from error context
        const contractText = error.details?.context?.contractText;
        if (contractText) {
          await handleAnalyze(contractText);
        }
      } catch (err) {
        if (err instanceof ContractAnalysisError) {
          setError(errorHandler.createErrorResponse(err, error.details?.context));
        }
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const parseRisksFromText = (text: string): Risk[] => {
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => ({
        type: 'legal' as const, // Default to legal, should be determined by content
        severity: 'medium' as const, // Default to medium, should be determined by content
        description: line.trim(),
        recommendation: '', // This will be filled from improvements
        section: '' // This should be extracted from the text
      }));
  };

  const parseRecommendationsFromText = (text: string): string[] => {
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());
  };

  return (
    <div className="space-y-6">
      {error && (
        <ErrorDisplay 
          error={error} 
          onDismiss={() => setError(null)}
          onRetry={error.retryable ? handleRetry : undefined}
        />
      )}
      <Tabs defaultValue="text" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="text">Szöveg Beírása</TabsTrigger>
          <TabsTrigger value="upload">Dokumentum Feltöltése</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-6">
          <ContractInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <ContractDocumentUpload onSaveAndAnalyze={handleDocumentUpload} isAnalyzing={isAnalyzing} />
        </TabsContent>
      </Tabs>

      <ContractAnalysisResults analyses={analysisResults} />
    </div>
  );
}
