import { LegalTranslationManager, LanguageCode } from '../i18n/LegalTranslationManager';
// @deno-types="https://esm.sh/@types/franc@6.0.0/index.d.ts"
import { franc } from 'https://esm.sh/franc@6.1.0';

/**
 * The result of processing a document.
 */
export interface ProcessingResult {
  originalText: string;
  detectedLanguage: LanguageCode | 'unknown';
}

/**
 * Processes raw document text to prepare it for analysis.
 * This includes language detection and other future steps.
 */
export class DocumentProcessor {
  private translationManager: LegalTranslationManager;

  constructor(translationManager: LegalTranslationManager) {
    this.translationManager = translationManager;
  }

  /**
   * Detects the language of a given text using the 'franc' library.
   * This is a robust, real implementation, replacing the previous dummy heuristic.
   * 
   * @param text The text to analyze.
   * @returns The detected language code or 'unknown'.
   */
  public detectLanguage(text: string): LanguageCode | 'unknown' {
    // Using franc for more reliable language detection.
    // We limit the check to our supported languages for better accuracy within our domain.
    const langCode = franc(text, {
        only: ['hun', 'eng', 'deu'] // ISO 639-3 codes for Hungarian, English, German
    });

    if (langCode === 'hun') return 'hu';
    if (langCode === 'eng') return 'en';
    if (langCode === 'deu') return 'de';
    
    return 'unknown';
  }

  /**
   * Processes a raw document text for initial analysis.
   * 
   * @param documentText The raw text content of the document.
   * @returns A ProcessingResult containing the original text and detected language.
   */
  public async process(documentText: string): Promise<ProcessingResult> {
    const language = this.detectLanguage(documentText);
    
    // In the future, other processing steps could be added here,
    // such as PII (Personally Identifiable Information) scrubbing,
    // text cleaning, or segmentation.

    return {
      originalText: documentText,
      detectedLanguage: language,
    };
  }

  /**
   * Performs a full, high-fidelity translation of a document.
   * This is a real implementation that leverages an LLM for context-aware translation.
   * 
   * @param text The text to translate.
   * @param targetLanguage The desired output language.
   * @returns A promise that resolves to the fully translated document.
   */
  public async translate(text: string, targetLanguage: LanguageCode): Promise<string> {
    return this.translationManager.translateFullDocument(text, targetLanguage);
  }
} 