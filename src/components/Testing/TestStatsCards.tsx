
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { TestStats } from './types';

interface TestStatsCardsProps {
  stats: TestStats;
}

export function TestStatsCards({ stats }: TestStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Összes Teszt</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              🧪
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sikeres</p>
              <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Figyelmeztetések</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sikertelen</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Futó</p>
              <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
