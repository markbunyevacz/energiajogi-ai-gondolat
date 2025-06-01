import { JSDOM } from 'jsdom';
import { createHash } from 'crypto';

export class HTMLParser {
  async parse(content: string): Promise<{
    text: string;
    metadata: Record<string, any>;
    hash: string;
    links: string[];
  }> {
    try {
      const dom = new JSDOM(content);
      const document = dom.window.document;
      const metadata: Record<string, any> = {};
      const links: string[] = [];

      // Extract metadata
      const metaTags = document.getElementsByTagName('meta');
      for (let i = 0; i < metaTags.length; i++) {
        const meta = metaTags[i];
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          metadata[name] = content;
        }
      }

      // Extract title
      const title = document.title;
      if (title) {
        metadata.title = title;
      }

      // Extract text content
      const textContent = document.body?.textContent || '';
      const cleanText = this.cleanText(textContent);

      // Extract links
      const anchorTags = document.getElementsByTagName('a');
      for (let i = 0; i < anchorTags.length; i++) {
        const href = anchorTags[i].getAttribute('href');
        if (href) {
          links.push(href);
        }
      }

      // Generate hash of the content
      const hash = createHash('sha256')
        .update(cleanText)
        .digest('hex');

      return {
        text: cleanText,
        metadata,
        hash,
        links
      };
    } catch (error: any) {
      throw new Error(`Failed to parse HTML: ${error?.message || 'Unknown error'}`);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim(); // Remove leading/trailing whitespace
  }

  async extractTables(content: string): Promise<Array<{
    headers: string[];
    rows: string[][];
  }>> {
    try {
      const dom = new JSDOM(content);
      const document = dom.window.document;
      const tables = document.getElementsByTagName('table');
      const extractedTables: Array<{ headers: string[]; rows: string[][] }> = [];

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const headers: string[] = [];
        const rows: string[][] = [];

        // Extract headers
        const headerCells = table.getElementsByTagName('th');
        for (let j = 0; j < headerCells.length; j++) {
          headers.push(this.cleanText(headerCells[j].textContent || ''));
        }

        // Extract rows
        const tableRows = table.getElementsByTagName('tr');
        for (let j = 0; j < tableRows.length; j++) {
          const row = tableRows[j];
          const cells = row.getElementsByTagName('td');
          const rowData: string[] = [];

          for (let k = 0; k < cells.length; k++) {
            rowData.push(this.cleanText(cells[k].textContent || ''));
          }

          if (rowData.length > 0) {
            rows.push(rowData);
          }
        }

        if (headers.length > 0 || rows.length > 0) {
          extractedTables.push({ headers, rows });
        }
      }

      return extractedTables;
    } catch (error: any) {
      throw new Error(`Failed to extract tables from HTML: ${error?.message || 'Unknown error'}`);
    }
  }
} 