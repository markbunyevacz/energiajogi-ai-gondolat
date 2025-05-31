import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { Risk } from '@/types';

interface RiskCardProps {
  risk: Risk;
  index: number;
}

export function RiskCard({ risk, index }: RiskCardProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Magas';
      case 'medium': return 'Közepes';
      case 'low': return 'Alacsony';
      default: return level;
    }
  };

  return (
    <Card key={index} className="border-l-4 border-l-mav-blue">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {getSeverityIcon(risk.severity)}
              <Badge variant="outline" className="text-xs">
                {risk.type === 'legal' && 'Jogi'}
                {risk.type === 'financial' && 'Pénzügyi'}
                {risk.type === 'operational' && 'Működési'}
              </Badge>
              {risk.section && (
                <Badge variant="secondary" className="text-xs">
                  {risk.section}
                </Badge>
              )}
            </div>
            <Badge className={getRiskLevelColor(risk.severity)}>
              {getRiskLevelLabel(risk.severity)}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-900 font-medium">
              {risk.description}
            </p>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <strong>Javaslat:</strong> {risk.recommendation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
