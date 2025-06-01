export class DocumentProcessor {
  /**
   * Cleans and normalizes document text
   */
  public static cleanDocument(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .replace(/[^\S\n]+/g, ' ') // Replace multiple spaces (except newlines) with single space
      .trim();
  }

  /**
   * Extracts text from common document formats
   */
  public static async extractTextFromDocument(file: File): Promise<string> {
    const text = await file.text();
    return this.cleanDocument(text);
  }

  /**
   * Validates if the document is a legal document
   */
  public static isValidLegalDocument(text: string): boolean {
    const legalKeywords = [
      'törvény',
      'rendelet',
      'határozat',
      'jogszabály',
      'ügy',
      'bíróság',
      'ügyvéd',
      'per',
      'jog',
      'törvénykezés',
    ];

    const lowerText = text.toLowerCase();
    return legalKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Extracts dates from text
   */
  public static extractDates(text: string): string[] {
    const datePatterns = [
      /\d{4}\.\s*\d{2}\.\s*\d{2}\./g, // 2024. 03. 15.
      /\d{4}\.\s*\d{2}\.\s*\d{2}/g,   // 2024. 03. 15
      /\d{4}-\d{2}-\d{2}/g,           // 2024-03-15
    ];

    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });

    return [...new Set(dates)];
  }

  /**
   * Extracts legal references from text
   */
  public static extractLegalReferences(text: string): string[] {
    const referencePatterns = [
      /\d{4}\.\s*évi\s*[A-Z]+\.\s*törvény/g,  // 2024. évi ABC törvény
      /\d{4}\.\s*évi\s*[A-Z]+\.\s*rendelet/g, // 2024. évi ABC rendelet
      /\d{4}\.\s*évi\s*[A-Z]+\.\s*határozat/g, // 2024. évi ABC határozat
    ];

    const references: string[] = [];
    referencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        references.push(...matches);
      }
    });

    return [...new Set(references)];
  }
} 