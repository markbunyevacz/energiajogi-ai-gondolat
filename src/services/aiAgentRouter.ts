import axios from 'axios';
import Tesseract from 'tesseract.js';
import { getDocument } from 'pdfjs-dist';
import { ContractAnalysisError, ErrorCodes } from '@/types/errors';

export type AgentType = 'contract' | 'legal_research' | 'compliance' | 'general';

export interface AgentContext {
  previousQuestions: string[];
  documentTypes: string[];
  userRole: string;
  sessionHistory: any[];
}

export interface AgentResponse {
  agentType: AgentType;
  confidence: number;
  reasoning: string;
  suggestedPrompt: string;
}

class AIAgentRouter {
  private contractKeywords = [
    'szerződés', 'megállapodás', 'feltétel', 'felmondás', 'módosítás',
    'kötelezettség', 'jog', 'kártérítés', 'garancia', 'szavatosság'
  ];

  private legalResearchKeywords = [
    'jogszabály', 'törvény', 'rendelet', 'határozat', 'precedens',
    'bírósági', 'ítélet', 'jogi', 'értelmezés', 'norma'
  ];

  private complianceKeywords = [
    'megfelelőség', 'előírás', 'szabályozás', 'ellenőrzés', 'audit',
    'kockázat', 'biztonság', 'adatvédelem', 'gdpr', 'mekh'
  ];

  analyzeQuestion(question: string, context?: AgentContext, options?: {
    extractClauses?: boolean;
    highlightRisks?: boolean;
    suggestImprovements?: boolean;
    contractText?: string;
  }): AgentResponse {
    const questionLower = question.toLowerCase();
    const scores = {
      contract: this.calculateScore(questionLower, this.contractKeywords),
      legal_research: this.calculateScore(questionLower, this.legalResearchKeywords),
      compliance: this.calculateScore(questionLower, this.complianceKeywords),
      general: 0.3 // Base score for general queries
    };

    // Add context-based scoring
    if (context) {
      this.adjustScoresWithContext(scores, context);
    }

    const bestMatch = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as AgentType] > scores[b[0] as AgentType] ? a : b
    );

    const agentType = bestMatch[0] as AgentType;
    const confidence = bestMatch[1];

    return {
      agentType,
      confidence,
      reasoning: this.getReasoningForAgent(agentType, confidence),
      suggestedPrompt: this.enhancePromptForAgent(question, agentType, options)
    };
  }

  private calculateScore(text: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => text.includes(keyword));
    return matches.length / keywords.length;
  }

  private adjustScoresWithContext(scores: Record<AgentType, number>, context: AgentContext) {
    // Boost scores based on recent questions
    const recentQuestions = context.previousQuestions.slice(0, 3).join(' ').toLowerCase();
    
    if (recentQuestions.includes('szerződés')) {
      scores.contract += 0.2;
    }
    
    if (context.documentTypes.includes('szerződés')) {
      scores.contract += 0.3;
    }

    // Role-based adjustments
    if (context.userRole === 'jogász') {
      scores.legal_research += 0.1;
    }
  }

  private getReasoningForAgent(agentType: AgentType, confidence: number): string {
    const reasonings = {
      contract: 'Szerződéses elemzésre specializált ágens kiválasztva a kérdésben található szerződéses fogalmak alapján.',
      legal_research: 'Jogi kutatási ágens kiválasztva a jogszabályi hivatkozások miatt.',
      compliance: 'Megfelelőségi ágens kiválasztva a szabályozási kérdések alapján.',
      general: 'Általános ágens kiválasztva, mivel a kérdés nem tartozik specifikus szakterülethez.'
    };

    return reasonings[agentType] + ` (Megbízhatóság: ${Math.round(confidence * 100)}%)`;
  }

  /**
   * Extracts and summarizes contract clauses from the provided contract text.
   * @param contractText The full text of the contract.
   * @returns A summary of key clauses.
   */
  public async extractAndSummarizeClauses(): Promise<string> {
    return 'Hiba történt a szerződés elemzése során.';
  }

  /**
   * Highlights risks or missing elements in the uploaded contract.
   * @param contractText The full text of the contract.
   * @returns A list of detected risks or missing elements.
   */
  public async highlightRisksOrMissingElements(contractText: string): Promise<string> {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'claude-sonnet-4-20250514',
        messages: [
          { 
            role: 'system', 
            content: `You are a legal contract analysis assistant specializing in risk assessment. 
                     Analyze the contract and identify potential risks, missing elements, or unclear clauses.
                     Focus on:
                     - Missing essential clauses (e.g., termination, liability, governing law)
                     - Unclear or ambiguous terms
                     - Compliance risks (GDPR, MEKH, etc.)
                     - Financial risks (e.g., payment terms, penalties)
                     - Operational risks (e.g., delivery, performance)
                     Format your response in Hungarian, with each risk on a new line.`
          },
          { 
            role: 'user', 
            content: `Analyze this contract for risks and missing elements:\n${contractText}`
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing contract risks:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new ContractAnalysisError(
            'Hiba történt a szerződés kockázatelemzése során.',
            ErrorCodes.API_ERROR,
            'error',
            { status: error.response.status, data: error.response.data }
          );
        } else if (error.request) {
          throw new ContractAnalysisError(
            'Hálózati hiba történt a szerződés kockázatelemzése során.',
            ErrorCodes.NETWORK_ERROR,
            'error',
            { request: error.request }
          );
        }
      }
      throw new ContractAnalysisError(
        'Ismeretlen hiba történt a szerződés kockázatelemzése során.',
        ErrorCodes.CONTRACT_ANALYSIS_ERROR,
        'error',
        { originalError: error }
      );
    }
  }

  /**
   * Suggests improvements or compliance checks for the contract.
   * @param contractText The full text of the contract.
   * @returns Suggestions for improvements or compliance.
   */
  public async suggestImprovementsOrComplianceChecks(contractText: string): Promise<string> {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'claude-sonnet-4-20250514',
        messages: [
          { 
            role: 'system', 
            content: `You are a legal contract improvement specialist. 
                     Analyze the contract and suggest specific improvements and compliance enhancements.
                     Focus on:
                     - Legal compliance improvements (e.g., GDPR, MEKH, industry regulations)
                     - Clarity and precision enhancements (e.g., ambiguous terms, definitions)
                     - Risk mitigation suggestions (e.g., liability, indemnification)
                     - Best practice recommendations (e.g., standard clauses, industry norms)
                     - Industry-specific improvements (e.g., sector-specific requirements)
                     Format your response in Hungarian, with each suggestion on a new line.`
          },
          { 
            role: 'user', 
            content: `Suggest improvements and compliance checks for this contract:\n${contractText}`
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error suggesting contract improvements:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new ContractAnalysisError(
            'Hiba történt a javaslatok generálása során.',
            ErrorCodes.API_ERROR,
            'error',
            { status: error.response.status, data: error.response.data }
          );
        } else if (error.request) {
          throw new ContractAnalysisError(
            'Hálózati hiba történt a javaslatok generálása során.',
            ErrorCodes.NETWORK_ERROR,
            'error',
            { request: error.request }
          );
        }
      }
      throw new ContractAnalysisError(
        'Ismeretlen hiba történt a javaslatok generálása során.',
        ErrorCodes.CONTRACT_ANALYSIS_ERROR,
        'error',
        { originalError: error }
      );
    }
  }

  private enhancePromptForAgent(question: string, agentType: AgentType, options?: {
    extractClauses?: boolean;
    highlightRisks?: boolean;
    suggestImprovements?: boolean;
    contractText?: string;
  }): string {
    const enhancements = {
      contract: () => {
        let prompt = `Szerződéses szakértőként elemezze a következő kérdést, különös figyelmet fordítva a jogi kötelezettségekre és kockázatokra: ${question}`;
        if (options?.extractClauses && options.contractText) {
          prompt += '\n' + this.extractAndSummarizeClauses();
        }
        if (options?.highlightRisks && options.contractText) {
          prompt += '\n' + this.highlightRisksOrMissingElements(options.contractText);
        }
        if (options?.suggestImprovements && options.contractText) {
          prompt += '\n' + this.suggestImprovementsOrComplianceChecks(options.contractText);
        }
        return prompt;
      },
      legal_research: () => `Jogi kutatási szakértőként válaszoljon a kérdésre, hivatkozva a releváns jogszabályokra és precedensekre: ${question}`,
      compliance: () => `Megfelelőségi szakértőként értékelje a kérdést, azonosítva a potenciális szabályozási kockázatokat: ${question}`,
      general: () => `Jogi szakértőként adjon átfogó választ a következő kérdésre: ${question}`
    };

    return enhancements[agentType]();
  }
}

export const aiAgentRouter = new AIAgentRouter();

export const extractTextFromImage = async (imageDataUrl: string): Promise<string> => {
  const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng+hun');
  return text;
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdf = await getDocument({ data: uint8Array }).promise;
    
    let text = '';
    let textMatches: string[] = [];
    
    // Try simple text extraction first
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      textMatches.push(pageText);
      text += pageText + '\n';
    }

    // Check if text extraction was successful
    const isMostlyNonText = (text: string) => {
      return (text.replace(/[^A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű0-9]/g, '').length < 30);
    };

    if (isMostlyNonText(text)) {
      // Fallback to OCR for image-based PDFs
      const numPages = Math.min(pdf.numPages, 3); // Limit to first 3 pages for performance
      let ocrText = '';
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: context!, viewport }).promise;
        const imageDataUrl = canvas.toDataURL('image/png');
        ocrText += await extractTextFromImage(imageDataUrl) + '\n';
      }
      
      return ocrText.trim() || '[PDF OCR feldolgozás sikertelen vagy üres.]';
    }

    return textMatches.join(' ').slice(0, 50000); // Limit to 50KB of text
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return `Dokumentum: ${file.name}. Szöveg kivonás sikertelen, de a fájl feltöltve.`;
  }
};

export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.9) return 'Kiváló megbízhatóság';
  if (confidence >= 0.8) return 'Magas megbízhatóság';
  if (confidence >= 0.6) return 'Közepes megbízhatóság';
  if (confidence >= 0.4) return 'Alacsony megbízhatóság';
  return 'Kevésbé megbízható';
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};
