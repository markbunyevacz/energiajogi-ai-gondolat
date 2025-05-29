
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} perce`;
  } else if (diffHours < 24) {
    return `${diffHours} órája`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} napja`;
  }
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'bg-green-100 text-green-800';
  if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 80) return 'Magas megbízhatóság';
  if (confidence >= 60) return 'Közepes megbízhatóság';
  return 'Alacsony megbízhatóság';
};

export const officialSources = {
  'Magyar Közlöny': 'https://magyarkozlony.hu/',
  'Nemzeti Jogszabálytár': 'https://net.jogtar.hu/',
  'MEKH': 'https://mekh.hu/',
  'EUR-Lex': 'https://eur-lex.europa.eu/homepage.html',
  'Energetikai és Közműszabályozási Hivatal': 'https://mekh.hu/',
  'Magyar Energetikai és Közműszabályozási Hivatal': 'https://mekh.hu/'
};

export const getOfficialSourceUrl = (source: string): string | null => {
  for (const [sourceName, url] of Object.entries(officialSources)) {
    if (source.toLowerCase().includes(sourceName.toLowerCase())) {
      return url;
    }
  }
  return null;
};

export const isUrl = (text: string): boolean => {
  return text.includes('http://') || text.includes('https://');
};

export const extractUrlFromSource = (source: string): string | null => {
  const urlMatch = source.match(/(https?:\/\/[^\s)]+)/);
  return urlMatch ? urlMatch[1] : null;
};

export const getSourceDisplayName = (source: string): string => {
  if (isUrl(source)) {
    return source.split(' - ')[0] || source;
  }
  return source;
};
