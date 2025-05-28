
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, FileText, MessageSquare, Shield, DollarSign, Activity, Users } from 'lucide-react';
import { UserRole, DashboardStats } from '@/types';

interface DashboardStatsProps {
  role: UserRole;
  stats: DashboardStats;
}

export function DashboardStatsComponent({ role, stats }: DashboardStatsProps) {
  const getStatsForRole = () => {
    switch (role) {
      case 'jogász':
        return [
          {
            title: 'Dokumentumok',
            value: stats.totalDocuments.toLocaleString(),
            description: 'Indexelt dokumentum',
            icon: FileText,
            trend: { value: 12, isPositive: true },
            color: 'text-blue-600'
          },
          {
            title: 'Jogi Kérdések',
            value: stats.recentQueries.toLocaleString(),
            description: 'Ez hónapban',
            icon: MessageSquare,
            trend: { value: 8, isPositive: true },
            color: 'text-green-600'
          },
          {
            title: 'Szerződések',
            value: stats.contractsAnalyzed.toLocaleString(),
            description: 'Elemzett szerződés',
            icon: Shield,
            trend: { value: 15, isPositive: true },
            color: 'text-purple-600'
          },
          {
            title: 'Kockázati Szint',
            value: `${stats.riskScore}%`,
            description: 'Átlagos kockázat',
            icon: Activity,
            trend: { value: 5, isPositive: false },
            color: 'text-orange-600'
          }
        ];

      case 'it_vezető':
        return [
          {
            title: 'API Használat',
            value: `${stats.apiUsage || 85}%`,
            description: 'Havi kvóta',
            icon: Activity,
            trend: { value: 12, isPositive: true },
            color: 'text-blue-600'
          },
          {
            title: 'Rendszer Teljesítmény',
            value: '99.8%',
            description: 'Üzemidő',
            icon: TrendingUp,
            trend: { value: 0.2, isPositive: true },
            color: 'text-green-600'
          },
          {
            title: 'Felhasználók',
            value: `${stats.userActivity || 24}`,
            description: 'Aktív felhasználó',
            icon: Users,
            trend: { value: 18, isPositive: true },
            color: 'text-purple-600'
          },
          {
            title: 'Válaszidő',
            value: '1.2s',
            description: 'Átlagos válaszidő',
            icon: Activity,
            trend: { value: 8, isPositive: false },
            color: 'text-orange-600'
          }
        ];

      case 'tulajdonos':
        return [
          {
            title: 'Költségmegtakarítás',
            value: `${(stats.costSavings || 450).toLocaleString()} eFt`,
            description: 'Ez hónapban',
            icon: DollarSign,
            trend: { value: 23, isPositive: true },
            color: 'text-green-600'
          },
          {
            title: 'ROI',
            value: '340%',
            description: 'Befektetés megtérülés',
            icon: TrendingUp,
            trend: { value: 45, isPositive: true },
            color: 'text-blue-600'
          },
          {
            title: 'Hatékonyság',
            value: '75%',
            description: 'Időmegtakarítás',
            icon: Activity,
            trend: { value: 12, isPositive: true },
            color: 'text-purple-600'
          },
          {
            title: 'Kockázatcsökkentés',
            value: '65%',
            description: 'Azonosított kockázatok',
            icon: Shield,
            trend: { value: 18, isPositive: true },
            color: 'text-orange-600'
          }
        ];

      default:
        return [];
    }
  };

  const statsData = getStatsForRole();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend.isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {stat.description}
                  </p>
                  <Badge 
                    variant={stat.trend.isPositive ? "default" : "destructive"}
                    className={`flex items-center space-x-1 ${
                      stat.trend.isPositive 
                        ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }`}
                  >
                    <TrendIcon className="h-3 w-3" />
                    <span>{stat.trend.value}%</span>
                  </Badge>
                </div>
                
                {/* Progress bar for certain metrics */}
                {(stat.title.includes('Használat') || stat.title.includes('Hatékonyság') || stat.title.includes('Kockázati')) && (
                  <Progress 
                    value={parseInt(stat.value.replace('%', ''))} 
                    className="h-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
