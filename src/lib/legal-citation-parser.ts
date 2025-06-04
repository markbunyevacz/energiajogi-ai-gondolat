interface CitationPattern {
  pattern: RegExp;
  type: 'case' | 'statute' | 'regulation';
  normalizer: (match: string) => string;
}

export class LegalCitationParser {
  private citationPatterns: Record<string, CitationPattern[]> = {
    'US': [
      // Federal cases - e.g., "123 F.3d 456 (5th Cir. 2001)"
      {
        pattern: /(\d+)\s+F\.?\s?(?:3d|2d|Supp\.?\s?\d*)\s+(\d+)\s*\(([^)]+)\s+(\d{4})\)/gi,
        type: 'case',
        normalizer: (match) => match.replace(/\s+/g, ' ').toUpperCase()
      },
      // Supreme Court cases - e.g., "123 U.S. 456 (2001)"
      {
        pattern: /(\d+)\s+U\.S\.\s+(\d+)\s*\((\d{4})\)/gi,
        type: 'case',
        normalizer: (match) => match.replace(/\s+/g, ' ').toUpperCase()
      },
      // USC citations - e.g., "42 U.S.C. § 1983"
      {
        pattern: /(\d+)\s+U\.S\.C\.?\s*§\s*(\d+(?:\([a-z]\))?)/gi,
        type: 'statute',
        normalizer: (match) => match.replace(/\s+/g, ' ').toUpperCase()
      },
      // CFR citations - e.g., "29 C.F.R. § 1630.2"
      {
        pattern: /(\d+)\s+C\.F\.R\.?\s*§\s*(\d+(?:\.\d+)*)/gi,
        type: 'regulation',
        normalizer: (match) => match.replace(/\s+/g, ' ').toUpperCase()
      }
    ]
  };

  extractCitations(content: string, options: { 
    jurisdiction: string; 
    types: string[] 
  }): { raw: string; normalized: string; type: string }[] {
    const citations: { raw: string; normalized: string; type: string }[] = [];
    const patterns = this.citationPatterns[options.jurisdiction] || this.citationPatterns['US'];
    
    for (const pattern of patterns) {
      if (!options.types.includes(pattern.type)) continue;
      
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        citations.push({
          raw: match[0],
          normalized: pattern.normalizer(match[0]),
          type: pattern.type
        });
      }
    }
    
    return citations;
  }
  
  private normalizeCitation(raw: string, jurisdiction: string): string {
    // Jurisdiction-specific normalization
    const normalizers: Record<string, (citation: string) => string> = {
      'US': (citation) => {
        return citation
          .replace(/\s+/g, ' ')
          .replace(/F\.\s*3d/gi, 'F.3d')
          .replace(/F\.\s*2d/gi, 'F.2d')
          .replace(/U\.\s*S\.\s*C\./gi, 'U.S.C.')
          .replace(/C\.\s*F\.\s*R\./gi, 'C.F.R.')
          .toUpperCase()
          .trim();
      }
    };
    
    const normalizer = normalizers[jurisdiction] || normalizers['US'];
    return normalizer(raw);
  }
} 