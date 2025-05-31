// Simple PDF text extraction utility
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // For now, we'll use a simple approach that handles PDF files better
    // In a production environment, you'd want to use a proper PDF library like pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to string and clean up common PDF artifacts
    let text = '';
    for (let i = 0; i < uint8Array.length; i++) {
      const char = uint8Array[i];
      // Only include printable ASCII characters and basic Unicode
      if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
        text += String.fromCharCode(char);
      } else if (char > 126) {
        // Handle basic Unicode characters
        text += ' '; // Replace with space for now
      }
    }
    
    // Clean up the text
    text = text
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Replace control characters with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Extract readable text patterns (basic PDF text extraction)
    const textMatches = text.match(/[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű0-9\s\.,;:!\?%\-\(\)]+/g);
    
    if (textMatches && textMatches.length > 0) {
      // Helper to check if text is mostly non-text (e.g., image-based PDF)
      const isMostlyNonText = (text: string) => {
        // Heuristic: if less than 30 printable characters, treat as non-text
        return (text.replace(/[^A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű0-9]/g, '').length < 30);
      };

      if (isMostlyNonText(text)) {
        // Convert first page of PDF to image and run OCR
        // (You'll need to use pdfjs-dist for this part)
        // For now, show a placeholder:
        return '[PDF szkennelt képként lett feltöltve, OCR feldolgozás szükséges]';
      }

      return textMatches.join(' ').slice(0, 50000); // Limit to 50KB of text
    }
    
    // If no readable text found, return filename as fallback
    return `Dokumentum: ${file.name}. PDF tartalom feldolgozás alatt.`;
    
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return `Dokumentum: ${file.name}. Szöveg kivonás sikertelen, de a fájl feltöltve.`;
  }
};

export const isValidTextContent = (content: string): boolean => {
  // Check if content contains null bytes or other problematic characters
  return !content.includes('\u0000') && content.length > 0;
};

export const sanitizeTextContent = (content: string): string => {
  return content
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ') // Replace control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};
