import { Risk } from '@/types';

export const generateMockRisks = () => {
  const allRisks = [
    {
      id: 'risk-1',
      description: 'Felmondási feltételek egyoldalúan a szolgáltató javára szólnak',
      level: 'high' as const
    },
    {
      id: 'risk-2',
      description: 'Késedelmi kamat mértéke magasabb a jogszabályi maximumnál',
      level: 'medium' as const
    },
    {
      id: 'risk-3',
      description: 'Értesítési kötelezettségek nem szimmetrikusak',
      level: 'low' as const
    }
  ];
  
  return allRisks.slice(0, Math.floor(Math.random() * 3) + 1);
};

export const generateMockRecommendations = (): string[] => {
  const allRecommendations = [
    'Adatvédelmi záradék GDPR-kompatibilis frissítése',
    'Vis maior események kibővítése járványhelyzetre',
    'Elektronikus kommunikáció feltételeinek pontosítása',
    'Szellemi tulajdon védelmének megerősítése',
    'Minőségbiztosítási követelmények bevezetése'
  ];
  
  return allRecommendations.slice(0, Math.floor(Math.random() * 3) + 2);
};
