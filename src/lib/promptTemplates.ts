// Prompt template for extracting metadata from a document chunk
export function getMetadataExtractionPrompt(chunk: string, context: string): string {
  return `Az alábbi szövegrészletből kérlek, azonosítsd a következő metaadatokat JSON formátumban:

- documentType: A dokumentum típusa (law, regulation, decision, other)
- date: A dokumentum dátuma (ha van)
- references: Hivatkozott jogszabályok vagy dokumentumok listája
- legalAreas: Jogterületek, amelyekhez a dokumentum kapcsolódik
- title: A dokumentum címe (ha van)
- source: Forrás (ha ismert)

Szövegrészlet:
"""
${chunk}
"""
${context ? `\nKontektsz: ${context}` : ''}

Válasz kizárólag érvényes JSON legyen!`;
} 