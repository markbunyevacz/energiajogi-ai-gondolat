
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from 'lucide-react';

interface TestProgressCardProps {
  isRunning: boolean;
  progress: number;
  currentPhase: string;
}

export function TestProgressCard({ isRunning, progress, currentPhase }: TestProgressCardProps) {
  if (!isRunning) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">🚀 Teljes Körű Tesztelési Terv Végrehajtás</h3>
              <p className="text-sm text-gray-600">{currentPhase}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{progress}%</span>
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          </div>
          <Progress value={progress} className="w-full h-3" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Inicializálás</span>
            <span>Autentikáció</span>
            <span>Dokumentumok</span>
            <span>Szerződések</span>
            <span>AI Ágensek</span>
            <span>Teljesítmény</span>
            <span>Regresszió</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
