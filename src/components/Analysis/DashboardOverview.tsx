
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { ContractAnalysis } from '@/types';

interface DashboardOverviewProps {
  analyses: ContractAnalysis[];
  completionRate: number;
}

export function DashboardOverview({ analyses, completionRate }: DashboardOverviewProps) {
  const getRiskStats = () => {
    const stats = { high: 0, medium: 0, low: 0 };
    analyses.forEach(analysis => {
      stats[analysis.riskLevel]++;
    });
    return stats;
  };

  const riskStats = getRiskStats();
  const todayAnalyses = analyses.filter(a => 
    new Date(a.timestamp) > new Date(Date.now() - 24*60*60*1000)
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{analyses.length}</div>
              <div className="text-sm text-gray-600">Elemzett Szerződés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{riskStats.high}</div>
              <div className="text-sm text-gray-600">Magas Kockázat</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <div className="text-sm text-gray-600">Befejezési Arány</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold">{todayAnalyses}</div>
              <div className="text-sm text-gray-600">Ma Elemezve</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
