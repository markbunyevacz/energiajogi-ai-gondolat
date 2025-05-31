import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ExternalLink } from 'lucide-react';

export function LegalSourcesWidget() {
  const legalSources = [
    { name: 'Magyar Közlöny', url: 'https://magyarkozlony.hu/', description: 'Hivatalos lap' },
    { name: 'Nemzeti Jogszabálytár', url: 'https://net.jogtar.hu/', description: 'Jogszabályok' },
    { name: 'MEKH', url: 'https://mekh.hu/', description: 'Energetikai hatóság' },
    { name: 'EUR-Lex', url: 'https://eur-lex.europa.eu/homepage.html', description: 'EU jogszabályok' }
  ];

  return (
    <Card className="w-80 shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <BookOpen className="w-5 h-5 text-mav-blue" />
          <span>Elsődleges Jogi Források</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {legalSources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 transition-colors group"
          >
            <div>
              <div className="font-medium text-sm">{source.name}</div>
              <div className="text-xs text-gray-500">{source.description}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-mav-blue transition-colors" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
