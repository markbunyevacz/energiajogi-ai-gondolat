
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceMetrics } from "@/components/Performance/PerformanceMetrics";
import { RealTimeDashboard } from "@/components/Analytics/RealTimeDashboard";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Zap } from 'lucide-react';

interface ITDashboardProps {
  role: string;
}

export function ITDashboard({ role }: ITDashboardProps) {
  // Only show for IT leaders and owners
  if (role !== 'it_vezető' && role !== 'tulajdonos') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">IT Teljesítmény Dashboard</h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Activity className="w-4 h-4 mr-1" />
          Valós idejű monitorozás
        </Badge>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendszer Állapot</CardTitle>
            <Server className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Működőképes</div>
            <p className="text-xs text-muted-foreground">
              Minden szolgáltatás elérhető
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hatékonyság</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Átlagos hit rate az elmúlt órában
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Teljesítmény</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142ms</div>
            <p className="text-xs text-muted-foreground">
              Átlagos válaszidő
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Részletes Teljesítmény Metrikák</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceMetrics />
        </CardContent>
      </Card>

      {/* Real-time Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Valós Idejű Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <RealTimeDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
