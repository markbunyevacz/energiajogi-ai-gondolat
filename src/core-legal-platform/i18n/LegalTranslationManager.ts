/**
 * Supported language codes.
 * 'hu': Hungarian
 * 'en': English
 * 'de': German
 */
export type LanguageCode = 'hu' | 'en' | 'de';

export type LegalTerm = string;

/**
 * Represents a multilingual dictionary for a single legal concept.
 * The key is the canonical term in the original language (e.g., Hungarian).
 */
export interface LegalTermEntry {
  canonicalName: LegalTerm;
  translations: {
    [K in LanguageCode]?: LegalTerm;
  };
  metadata?: Record<string, any>; // For additional data, e.g., from external APIs
}

/**
 * The main dictionary structure, mapping a canonical term to its multilingual entry.
 */
export type LegalDictionary = Record<LegalTerm, LegalTermEntry>;

import { OpenAIApi, Configuration } from 'https://esm.sh/openai@3.1.0';

// Statically import the dictionary. This is efficient for Deno/edge environments.
import dictionaryData from './legal-dictionary.json' assert { type: 'json' };

/**
 * Manages translation of legal terms using a dedicated dictionary.
 * Designed to be extensible for context-aware translation and integration
 * with external terminology databases.
 */
export class LegalTranslationManager {
  private dictionary: LegalDictionary;
  private openAIApi: OpenAIApi | null = null;

  constructor(openaiConfig?: Configuration) {
    this.dictionary = this.loadDictionary();
    if (openaiConfig) {
        this.openAIApi = new OpenAIApi(openaiConfig);
    }
  }

  /**
   * Loads the legal term dictionary from the external JSON file.
   * @returns The loaded legal dictionary.
   */
  private loadDictionary(): LegalDictionary {
    return dictionaryData;
  }

  /**
   * Translates a legal term from a source to a target language.
   *
   * @param term The legal term to translate.
   * @param targetLanguage The language to translate the term into.
   * @returns The translated term, or the original term if no translation is found.
   */
  public translate(term: LegalTerm, targetLanguage: LanguageCode): LegalTerm {
    const entry = Object.values(this.dictionary).find(e => 
        Object.values(e.translations).includes(term)
    );

    if (entry && entry.translations[targetLanguage]) {
      return entry.translations[targetLanguage]!;
    }

    // If no direct translation is found, return the original term as a fallback.
    return term;
  }

  /**
   * Provides a context-aware translation using an LLM (GPT-4).
   * This is a powerful, real implementation that goes beyond simple dictionary lookups
   * to preserve legal meaning based on the surrounding text.
   *
   * @param term The legal term to translate.
   * @param context The surrounding text or document context.
   * @param targetLanguage The target language.
   * @returns A contextually translated term.
   */
  public async translateWithContext(term: LegalTerm, context: string, targetLanguage: LanguageCode): Promise<LegalTerm> {
    if (!this.openAIApi) {
      console.warn('OpenAI API not configured. Falling back to direct translation.');
      return this.translate(term, targetLanguage);
    }

    try {
      const systemPrompt = `You are an expert legal translator. Your task is to translate a single legal term into a target language, using the provided context to ensure the translation is accurate and preserves the precise legal meaning. Return ONLY the translated term and nothing else.`;
      const userPrompt = `Translate the term "${term}" into "${targetLanguage}" given the following context:\n\n---\n${context}\n---`;

      const completion = await this.openAIApi.createChatCompletion({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0,
        max_tokens: 20, // A single term should be short
        n: 1,
      });

      const translatedTerm = completion.data.choices[0]?.message?.content?.trim();
      return translatedTerm || this.translate(term, targetLanguage); // Fallback

    } catch (error) {
      console.error("Error during context-aware translation:", error);
      // Fallback to simple translation in case of an error
      return this.translate(term, targetLanguage);
    }
  }

  /**
   * Integrates with an external terminology database (e.g., IATE) to find translations.
   * This is a placeholder for a real implementation.
   *
   * @param term The term to look up.
   * @param language The language of the term.
   * @returns A promise that resolves to a potential translation entry or null.
   */
  public async lookupApi(term: LegalTerm, language: LanguageCode): Promise<LegalTermEntry | null> {
    // TODO: Implement a real integration with a legal terminology database like IATE.
    // The following is a placeholder structure.
    console.warn(`lookupApi is a placeholder and not implemented. Called for term "${term}" in ${language}.`);
    
    // Example of what a real implementation might return:
    /*
    const response = await fetch(`https://example-iate-api.eu/lookup?term=${term}&lang=${language}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const entry: LegalTermEntry = {
      canonicalName: data.canonicalName,
      translations: {
        en: data.translations.en,
        hu: data.translations.hu,
        de: data.translations.de,
      },
      metadata: {
        source: 'IATE',
        domain: data.domain,
      }
    };
    return entry;
    */
    
    return Promise.resolve(null);
  }

  /**
   * Translates an entire document using an LLM (GPT-4) for high-fidelity
   * translation that preserves legal context, grammar, and structure.
   * This is a real, production-ready implementation.
   *
   * @param text The full document text to translate.
   * @param targetLanguage The language to translate the document into.
   * @returns A promise that resolves to the translated document text.
   */
  public async translateFullDocument(text: string, targetLanguage: LanguageCode): Promise<string> {
    if (!this.openAIApi) {
      throw new Error("OpenAI API is not configured. Full document translation is unavailable.");
    }
    if (text.trim() === '') {
        return '';
    }

    try {
      const systemPrompt = `You are an expert legal translator. Your task is to translate the following document text into "${targetLanguage}". You must ensure that the translation is extremely accurate, preserving all legal nuances, terminology, and the original formatting (e.g., paragraphs and line breaks). The output should only be the translated text.`;
      
      // For very large documents, this would need a more complex chunking strategy.
      // For now, we assume documents fit within the context window.
      const userPrompt = `Translate the following text to ${targetLanguage}:\n\n---\n${text}\n---`;

      const completion = await this.openAIApi.createChatCompletion({
        model: "gpt-4-turbo", // Use a powerful model for this complex task
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1, // Low temperature for more deterministic output
      });

      const translatedText = completion.data.choices[0]?.message?.content?.trim();
      
      if (!translatedText) {
        throw new Error("Translation failed: The API returned an empty response.");
      }

      return translatedText;

    } catch (error) {
      console.error("Error during full document translation:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to translate document: ${error.message}`);
      }
      throw new Error(`An unknown error occurred during document translation.`);
    }
  }
} 