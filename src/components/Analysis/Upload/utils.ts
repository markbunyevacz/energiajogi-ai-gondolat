import { getDocument } from 'pdfjs-dist';
import { extractTextFromImage } from '@/services/aiAgentRouter';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  try {
    // Handle text files
    if (file.type === 'text/plain') {
      return await file.text();
    }

    // Handle PDF files
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
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
    }

    // Handle image files
    if (file.type.startsWith('image/')) {
      const imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      return await extractTextFromImage(imageDataUrl);
    }

    // For unsupported file types
    throw new Error(`Nem támogatott fájltípus: ${file.type}`);
  } catch (error: unknown) {
    console.error('Error extracting text from file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba';
    throw new Error(`Hiba történt a fájl feldolgozása során: ${errorMessage}`);
  }
};
