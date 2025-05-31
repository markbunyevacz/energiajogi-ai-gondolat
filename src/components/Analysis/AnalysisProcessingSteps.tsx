import React from 'react';
import { ContractAnalysis } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Shield } from 'lucide-react';

interface AnalysisProcessingStepsProps {
  analysis: ContractAnalysis;
}

export function AnalysisProcessingSteps({ analysis }: AnalysisProcessingStepsProps) {
  const steps = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Dokumentum Feldolgozás',
      description: 'A dokumentum tartalmának elemzése és strukturálása',
      status: analysis.status === 'completed' ? 'completed' : 'pending'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Kockázatelemzés',
      description: 'Jogi kockázatok azonosítása és értékelése',
      status: analysis.risks?.length ? 'completed' : 'pending'
    }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                {step.icon}
              </div>
              <div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <span className="text-xs text-muted-foreground">
                  {step.status === 'completed' ? 'Befejezett' : 'Folyamatban'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
