
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === 'text/plain') {
    return await file.text();
  }
  // For demo purposes, return placeholder text for other file types
  return `[Szerződés tartalma: ${file.name}]\n\nEz egy demo szöveg a szerződés tartalmának helyettesítésére. Valós implementációban PDF/DOC fájlok szövegét kellene kinyerni.\n\nSZERZŐDÉS ENERGIASZOLGÁLTATÁSRÓL\n\n1. SZERZŐDŐ FELEK\nSzolgáltató: MVM Energetika Zrt.\nFogyasztó: Példa Kft.\n\n2. SZOLGÁLTATÁS TÁRGYA\nA szolgáltató vállalja villamos energia szállítását a fogyasztó részére.\n\n7. ÁRAZÁS\n7.1 Az energia ára: 45 Ft/kWh\n7.2 Az árak változtatására a szolgáltató jogosult 30 napos előzetes értesítéssel.\n\n12. VIS MAIOR\nVis maior eseménynek minősül minden olyan esemény, amely a szolgáltató befolyásán kívül áll.`;
};
