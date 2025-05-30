
import { Risk } from '@/types';

export const generateMockRisks = (): Risk[] => {
  const allRisks = [
    {
      type: 'legal' as const,
      severity: 'high' as const,
      description: 'Felmondási feltételek egyoldalúan a szolgáltató javára szólnak',
      recommendation: 'Kölcsönös felmondási jogok biztosítása megfelelő határidőkkel',
      section: '8. szakasz'
    },
    {
      type: 'financial' as const,
      severity: 'medium' as const,
      description: 'Késedelmi kamat mértéke magasabb a jogszabályi maximumnál',
      recommendation: 'Késedelmi kamat csökkentése a Ptk. szerinti mértékre',
      section: '11.3 pont'
    },
    {
      type: 'operational' as const,
      severity: 'low' as const,
      description: 'Értesítési kötelezettségek nem szimmetrikusak',
      recommendation: 'Kölcsönös értesítési kötelezettségek meghatározása',
      section: '14. szakasz'
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
