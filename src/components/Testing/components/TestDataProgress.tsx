import React from 'react';
import { Progress } from "@/components/ui/progress";

interface TestDataProgressProps {
  isGenerating: boolean;
  progress: number;
}

export function TestDataProgress({ isGenerating, progress }: TestDataProgressProps) {
  if (!isGenerating) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Teszt adatok generálása...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
