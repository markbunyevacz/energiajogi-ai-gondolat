import * as pdfjsLib from 'pdfjs-dist';
import { createHash } from 'crypto';

export class PDFParser {
  private async loadPDF(content: string): Promise<pdfjsLib.PDFDocumentProxy> {
    const pdfData = new Uint8Array(Buffer.from(content, 'base64'));
    return await pdfjsLib.getDocument({ data: pdfData }).promise;
  }

  async parse(content: string): Promise<{
    text: string;
    metadata: Record<string, any>;
    hash: string;
  }> {
    try {
      const pdf = await this.loadPDF(content);
      const numPages = pdf.numPages;
      let fullText = '';
      const metadata: Record<string, any> = {};

      // Extract metadata
      const info = await pdf.getMetadata();
      if (info.info) {
        Object.assign(metadata, info.info);
      }

      // Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      // Generate hash of the content
      const hash = createHash('sha256')
        .update(fullText)
        .digest('hex');

      return {
        text: fullText,
        metadata,
        hash
      };
    } catch (error: any) {
      throw new Error(`Failed to parse PDF: ${error?.message || 'Unknown error'}`);
    }
  }

  async extractImages(content: string): Promise<Array<{
    data: Uint8Array;
    format: string;
  }>> {
    try {
      const pdf = await this.loadPDF(content);
      const images: Array<{ data: Uint8Array; format: string }> = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const ops = await page.getOperatorList();
        
        for (let j = 0; j < ops.fnArray.length; j++) {
          if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
            const imgName = ops.argsArray[j][0];
            const img = await page.objs.get(imgName);
            if (img && img.data) {
              images.push({
                data: img.data,
                format: img.format || 'unknown'
              });
            }
          }
        }
      }

      return images;
    } catch (error: any) {
      throw new Error(`Failed to extract images from PDF: ${error?.message || 'Unknown error'}`);
    }
  }
} 