import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

// Configure the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

interface AnalysisRisk {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  section: string;
}

interface AnalysisResult {
  id: string;
  risk_level: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  risks: AnalysisRisk[];
  status?: 'processing' | 'analyzing' | 'completed' | 'failed';
}

/**
 * Extracts text content from a given file.
 * Currently supports PDF files.
 * @param file - The file to extract text from.
 * @returns A promise that resolves with the extracted text content.
 */
async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ');
    }
    return textContent;
  }
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  // .doc format is not supported for client-side extraction.
  throw new Error('Unsupported file type for text extraction. Please use PDF or DOCX.');
}

/**
 * LovableFrontend Component - Main Legal Document Analysis Interface
 *
 * This component serves as the primary user interface for the Jogi AI Demo application,
 * providing a comprehensive legal document analysis workflow. It integrates with the
 * backend AI services to deliver intelligent contract analysis, legal opinions, and
 * document summaries.
 *
 * ARCHITECTURE OVERVIEW:
 * - Built with React functional components and hooks for state management
 * - Integrates with Supabase backend services for document processing
 * - Uses Radix UI components for accessible, consistent user interface
 * - Implements Hungarian localization for user-facing text
 * - Follows modern React patterns with TypeScript for type safety
 *
 * STATE MANAGEMENT:
 * - `file`: File object storing the selected document for analysis
 * - `analysisType`: String indicating the type of analysis ('contract', 'legal', 'summary')
 * - `notes`: User-provided additional context and requirements
 * - `loading`: Boolean flag for async operation state management
 * - `result`: Analysis results object containing risk assessment and suggestions
 * - `error`: Error state for user feedback and debugging
 *
 * KEY FEATURES:
 * - Multi-format file upload support (PDF, DOC, DOCX)
 * - Intelligent analysis type selection with specialized AI agents
 * - Contextual notes input for enhanced analysis accuracy
 * - Real-time loading states with user feedback
 * - Comprehensive results display with risk assessment
 * - Error handling with user-friendly Hungarian messages
 * - Responsive design for various screen sizes
 *
 * INTEGRATION POINTS:
 * - Backend API integration (currently needs update to use Supabase functions)
 * - AI Agent Router for intelligent query processing
 * - Document processing services for text extraction
 * - Error handling and logging services
 *
 * ACCESSIBILITY FEATURES:
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast design elements
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Efficient re-rendering with proper React patterns
 * - File validation to prevent unnecessary processing
 * - Loading states to prevent multiple simultaneous requests
 * - Error boundaries for graceful failure handling
 *
 * @fileoverview Main legal document analysis interface component
 * @author Legal AI Team / Lovable
 * @since 1.0.0
 * @version 1.0.0
 */
export function LovableFrontend() {
  const { user } = useAuth();
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /** 
   * Selected file for analysis - supports PDF, DOC, DOCX formats
   * Validated on selection to ensure proper file type and size limits
   */
  const [file, setFile] = useState<File | null>(null);
  
  /** 
   * Analysis type selection - determines which AI agent will process the document
   * Options: 'contract' (szerződés), 'legal' (jogi vélemény), 'summary' (összefoglaló)
   */
  const [analysisType, setAnalysisType] = useState('contract');
  
  /** 
   * User-provided notes and additional context for the analysis
   * Helps the AI provide more targeted and relevant insights
   */
  const [notes, setNotes] = useState('');
  
  /** 
   * Loading state for async operations (file upload, analysis processing)
   * Prevents multiple simultaneous requests and provides user feedback
   */
  const [loading, setLoading] = useState(false);
  
  /** 
   * Analysis results from the backend AI service
   * Contains risk assessment, suggestions, and detailed analysis
   * TODO: Define proper TypeScript interface for result structure
   */
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  
  /** 
   * Error state for user feedback and debugging
   * Displays localized error messages in Hungarian
   */
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * File Input Change Handler
   * 
   * Handles file selection from the input element with validation and error handling.
   * Supports PDF, DOC, and DOCX formats with size limitations.
   * 
   * VALIDATION CHECKS:
   * - File type validation (PDF, DOC, DOCX)
   * - File size limits (configurable, typically 10MB max)
   * - File integrity checks
   * 
   * ERROR HANDLING:
   * - Invalid file types show user-friendly error messages
   * - Large files are rejected with size information
   * - Corrupted files are detected and handled gracefully
   * 
   * @param e - File input change event containing the selected file
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear any previous errors when selecting a new file
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const SUPPORTED_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!SUPPORTED_TYPES.includes(selectedFile.type)) {
        setError('Nem támogatott fájlformátum. Kérlek, válassz PDF vagy DOCX fájlt.');
        setFile(null);
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('A fájl mérete meghaladja a 10MB-os korlátot.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  /**
   * Analysis Type Selection Handler
   * 
   * Handles the selection of analysis type which determines which AI agent
   * will process the document. Each type has specialized prompts and processing logic.
   * 
   * ANALYSIS TYPES:
   * - 'contract': Contract analysis with risk assessment and clause review
   * - 'legal': Legal opinion generation with precedent analysis
   * - 'summary': Document summarization with key points extraction
   * 
   * @param e - Select element change event with the chosen analysis type
   */
  const handleAnalysisTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnalysisType(e.target.value);
    
    // Clear previous results when changing analysis type
    // This prevents confusion with results from different analysis types
    setResult(null);
    setError(null);
  };

  /**
   * Notes Input Change Handler
   * 
   * Handles user input for additional notes and context that will be provided
   * to the AI agent for more targeted analysis. Notes help improve analysis
   * accuracy and relevance.
   * 
   * USAGE EXAMPLES:
   * - "Focus on termination clauses"
   * - "Check compliance with GDPR"
   * - "Analyze payment terms and penalties"
   * 
   * @param e - Textarea change event with the user's notes
   */
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  /**
   * Document Analysis Handler - Main Processing Function
   * 
   * This is the core function that orchestrates the document analysis workflow.
   * It handles file validation, API communication, and result processing with
   * comprehensive error handling and user feedback.
   * 
   * WORKFLOW STEPS:
   * 1. Input validation (file selection, type checking)
   * 2. State management (loading, error clearing)
   * 3. File preparation and FormData creation
   * 4. API communication with backend services
   * 5. Response processing and result display
   * 6. Error handling with localized messages
   * 
   * CURRENT IMPLEMENTATION ISSUES:
   * - Uses REST API endpoint '/api/analyze' which doesn't exist
   * - Should be updated to use Supabase edge functions
   * - Missing file type and size validation
   * - No progress tracking for long-running analyses
   * 
   * RECOMMENDED IMPROVEMENTS:
   * - Integrate with Supabase functions: supabase.functions.invoke('analyze-contract')
   * - Add file validation before processing
   * - Implement progress tracking with real-time updates
   * - Add retry logic for failed requests
   * - Enhance error categorization and handling
   * 
   * @async
   * @function handleAnalyze
   * @returns {Promise<void>} Resolves when analysis is complete or fails
   * 
   * @example
   * // Typical usage flow:
   * // 1. User selects file
   * // 2. User chooses analysis type
   * // 3. User adds optional notes
   * // 4. User clicks "Elemzés indítása" button
   * // 5. handleAnalyze() processes the request
   */
  const handleAnalyze = async () => {
    // ========================================================================
    // INITIALIZATION AND VALIDATION
    // ========================================================================
    
    // Set loading state and clear previous results/errors
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Validate file selection - required for analysis
      if (!file) {
        setError('Kérlek, válassz ki egy fájlt!');
        setLoading(false);
        return;
      }
      
      // TODO: Add comprehensive file validation
      // - Check file type (PDF, DOC, DOCX)
      // - Validate file size (max 10MB)
      // - Check file integrity
      // - Scan for malicious content
      
      // ======================================================================
      // API REQUEST PREPARATION
      // ======================================================================
      
      // Prepare form data for file upload and analysis parameters
      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysisType', analysisType);
      formData.append('notes', notes);

      // TODO: Add additional metadata
      // formData.append('userId', user.id);
      // formData.append('timestamp', new Date().toISOString());
      // formData.append('clientVersion', APP_VERSION);

      // ======================================================================
      // API COMMUNICATION (UPDATED TO USE SUPABASE)
      // ======================================================================

      const textContent = await extractTextFromFile(file);
      if (!textContent) {
        throw new Error('Could not extract text from the file. Supported format is PDF.');
      }

      const { data, error: supabaseError } = await supabase.functions.invoke('analyze-contract', {
        body: {
          // Using crypto.randomUUID() for a simple unique ID.
          documentId: crypto.randomUUID(),
          content: textContent,
          userId: user?.id,
          analysisType,
          notes,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      // ======================================================================
      // RESPONSE PROCESSING
      // ======================================================================
      
      if (!data.success) {
        throw new Error(data.error || 'A szerver hibát jelzett.');
      }
      
      // Check for HTTP errors
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      // Parse JSON response
      const { data: responseData, error: responseError } = data;
      if (responseError) {
        throw new Error(responseError.message);
      }
      
      // Update state with analysis results
      if (responseData) {
        setResult(responseData);
        setAnalysisId(responseData.id);
      }
      
      // TODO: Add success tracking and analytics
      // analytics.track('document_analysis_completed', {
      //   analysisType,
      //   fileType: file.type,
      //   processingTime: Date.now() - startTime
      // });
      
    } catch (e: any) {
      // ======================================================================
      // ERROR HANDLING
      // ======================================================================
      
      // Log error for debugging and monitoring
      console.error('Document analysis error:', e);
      
      // TODO: Integrate with error correlation service
      // errorCorrelationService.logError(e, {
      //   component: 'LovableFrontend',
      //   action: 'document-analysis',
      //   userId: user?.id,
      //   fileType: file?.type,
      //   analysisType
      // });
      
      // Display user-friendly error message in Hungarian
      const errorMessage = e.message || 'Hiba történt az elemzés során.';
      setError(errorMessage);
      
      // TODO: Add specific error handling for different error types
      // - Network errors: 'Hálózati hiba. Kérlek, próbáld újra.'
      // - File format errors: 'Nem támogatott fájlformátum.'
      // - Size limit errors: 'A fájl túl nagy. Maximum 10MB engedélyezett.'
      // - Server errors: 'Szerver hiba. Kérlek, próbáld újra később.'
      
    } finally {
      // ======================================================================
      // CLEANUP
      // ======================================================================
      
      // Always clear loading state, regardless of success or failure
      setLoading(false);
      
      // TODO: Add cleanup for any temporary resources
      // - Clear temporary file references
      // - Cancel any pending requests
      // - Reset progress indicators
    }
  };

  useEffect(() => {
    if (!analysisId) return;

    const channel = supabase.channel(`analysis-progress:${analysisId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contract_analyses',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          const newRecord = payload.new as any as AnalysisResult;
          if (newRecord.status === 'completed') {
            setResult(newRecord);
            setProgress('Elemzés befejezve.');
            setLoading(false);
            channel.unsubscribe();
          } else if (newRecord.status === 'failed') {
            setError('Hiba történt az elemzés során.');
            setProgress('Az elemzés sikertelen.');
            setLoading(false);
            channel.unsubscribe();
          } else {
            setProgress(`Folyamatban: ${newRecord.status}`);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [analysisId]);

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Jogi AI Demo</CardTitle>
            <CardDescription>
              A jogi dokumentumok elemzésére és feldolgozására szolgáló AI-alapú megoldás
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="document">Dokumentum feltöltése</Label>
                <Input id="document" type="file" accept=".pdf,.docx" onChange={handleFileChange} />
                {file && <span className="text-xs text-muted-foreground">Kiválasztva: {file.name}</span>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="analysis">Elemzés típusa</Label>
                <select id="analysis" className="w-full p-2 border rounded" value={analysisType} onChange={handleAnalysisTypeChange}>
                  <option value="contract">Szerződés elemzése</option>
                  <option value="legal">Jogi vélemény</option>
                  <option value="summary">Összefoglaló</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Megjegyzések</Label>
                <Textarea id="notes" placeholder="További megjegyzések vagy követelmények..." value={notes} onChange={handleNotesChange} />
              </div>
              <Button className="w-full" onClick={handleAnalyze} disabled={loading || !file}>
                {loading ? 'Elemzés folyamatban...' : 'Elemzés indítása'}
              </Button>
              {progress && <div className="text-blue-500 text-sm mt-2">{progress}</div>}
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eredmények</CardTitle>
            <CardDescription>
              Az AI által generált elemzés és javaslatok
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-2">Kockázati értékelés</h3>
                  <p className="text-sm text-gray-600">
                    A dokumentum áttekintése alapján a kockázati szint: <b>{result.risk_level}</b>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Összefoglaló: {result.summary}</p>
                </div>
                {result.recommendations && result.recommendations.length > 0 && (
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-2">Javaslatok</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                      {result.recommendations.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                )}
                {result.risks && result.risks.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Kockázatok</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {result.risks.map((risk: AnalysisRisk, i: number) => (
                        <li key={i}>
                          <b>{risk.type} ({risk.severity}):</b> {risk.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Nincs még eredmény.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 