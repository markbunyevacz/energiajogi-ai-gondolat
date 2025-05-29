export interface OfficialSource {
  name: string;
  url: string;
  description: string;
  keywords: string[];
  category: 'legal' | 'regulatory' | 'official';
}

export class OfficialSourceService {
  private static sources: OfficialSource[] = [
    {
      name: 'Magyar Közlöny',
      url: 'https://magyarkozlony.hu/',
      description: 'Hivatalos lap',
      keywords: ['magyar közlöny', 'mk.', 'magyarkozlony.hu'],
      category: 'official'
    },
    {
      name: 'Nemzeti Jogszabálytár',
      url: 'https://net.jogtar.hu/',
      description: 'Jogszabályok',
      keywords: ['jogtar.hu', 'net.jogtar.hu', 'jogszabálytár', 'törvény', 'rendelet'],
      category: 'legal'
    },
    {
      name: 'MEKH',
      url: 'https://mekh.hu/',
      description: 'Magyar Energetikai és Közmű-szabályozási Hivatal',
      keywords: ['mekh.hu', 'mekh', 'energetikai hivatal', 'közmű-szabályozási'],
      category: 'regulatory'
    },
    {
      name: 'EUR-Lex',
      url: 'https://eur-lex.europa.eu/',
      description: 'EU jogszabályok',
      keywords: ['eur-lex.europa.eu', 'eur-lex', 'európai unió', 'eu jogszabály'],
      category: 'legal'
    },
    {
      name: 'Kormány.hu',
      url: 'https://kormany.hu/',
      description: 'Magyar Kormány hivatalos oldala',
      keywords: ['kormany.hu', 'kormány', 'minisztérium'],
      category: 'official'
    },
    {
      name: 'MVH',
      url: 'https://www.mvh.allamkincstar.gov.hu/',
      description: 'Magyar Államkincstár',
      keywords: ['mvh', 'államkincstár', 'allamkincstar.gov.hu'],
      category: 'official'
    }
  ];

  public static getAllSources(): OfficialSource[] {
    return this.sources;
  }

  public static detectSourcesInText(text: string): { source: OfficialSource; matches: string[] }[] {
    const results: { source: OfficialSource; matches: string[] }[] = [];
    
    this.sources.forEach(source => {
      const matches: string[] = [];
      
      source.keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const textMatches = text.match(regex);
        if (textMatches) {
          matches.push(...textMatches);
        }
      });
      
      if (matches.length > 0) {
        results.push({ source, matches });
      }
    });
    
    return results;
  }

  public static linkifyOfficialSources(text: string): string {
    let linkedText = text;
    
    this.sources.forEach(source => {
      source.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        linkedText = linkedText.replace(regex, (match) => {
          return `[${match}](${source.url})`;
        });
      });
    });
    
    return linkedText;
  }

  public static extractUrlFromText(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    return text.match(urlRegex) || [];
  }
}
