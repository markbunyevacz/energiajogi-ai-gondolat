import { Risk } from '@/types';

export const generateMockRisks = () => {
  const allRisks: Risk[] = [
    {
      id: 'risk-1',
      description: 'Felmondási feltételek egyoldalúan a szolgáltató javára szólnak',
      level: 'high' as const,
      type: 'legal',
      severity: 'high',
      recommendation: 'Felmondási feltételek kiegyenlítése mindkét fél számára',
      section: 'Felmondási záradék'
    },
    {
      id: 'risk-2',
      description: 'Késedelmi kamat mértéke magasabb a jogszabályi maximumnál',
      level: 'medium' as const,
      type: 'financial',
      severity: 'medium',
      recommendation: 'Késedelmi kamat mértékének csökkentése a jogszabályi maximumra',
      section: 'Késedelmi kamat'
    },
    {
      id: 'risk-3',
      description: 'Értesítési kötelezettségek nem szimmetrikusak',
      level: 'low' as const,
      type: 'operational',
      severity: 'low',
      recommendation: 'Értesítési kötelezettségek kiegyenlítése',
      section: 'Értesítési kötelezettségek'
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
