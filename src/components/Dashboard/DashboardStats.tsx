
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, FileText, MessageSquare, Shield, DollarSign, Activity, Users } from 'lucide-react';
import { UserRole, DashboardStats } from '@/types';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';

interface DashboardStatsProps {
  role: UserRole;
  stats: DashboardStats;
}

export function DashboardStatsComponent({ role, stats }: DashboardStatsProps) {
  const { data: analyticsData } = useRealTimeAnalytics(24);

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
            title: 'API Teljesítmény',
            value: `${analyticsData?.api_performance.avg_response_time.toFixed(0) || 'N/A'}ms`,
            description: 'Átlagos válaszidő',
            icon: Activity,
            trend: { value: 12, isPositive: analyticsData?.api_performance.avg_response_time < 2000 },
            color: 'text-blue-600'
          },
          {
            title: 'Rendszer Állapot',
            value: analyticsData?.system_health?.filter(s => s.status === 'healthy').length || 0,
            description: `${analyticsData?.system_health?.length || 0} szolgáltatásból`,
            icon: TrendingUp,
            trend: { value: 0.2, isPositive: true },
            color: 'text-green-600'
          },
          {
            title: 'Aktív Felhasználók',
            value: `${analyticsData?.user_activity.active_users || stats.userActivity || 24}`,
            description: 'Utolsó 24 órában',
            icon: Users,
            trend: { value: 18, isPositive: true },
            color: 'text-purple-600'
          },
          {
            title: 'Hibaarány',
            value: `${analyticsData?.api_performance.error_rate.toFixed(1) || '0.2'}%`,
            description: 'API hibák',
            icon: Activity,
            trend: { value: 8, isPositive: false },
            color: 'text-orange-600'
          }
        ];

      case 'tulajdonos':
        return [
          {
            title: 'Napi Költségek',
            value: `${analyticsData?.costs.total_cost.toFixed(0) || (stats.costSavings || 450)} Ft`,
            description: 'Mai költség',
            icon: DollarSign,
            trend: { value: 23, isPositive: false },
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
            title: 'Felhasználói Aktivitás',
            value: `${analyticsData?.user_activity.total_events || 156}`,
            description: 'Események ma',
            icon: Activity,
            trend: { value: 12, isPositive: true },
            color: 'text-purple-600'
          },
          {
            title: 'Rendszer Hatékonyság',
            value: `${analyticsData?.api_performance.avg_response_time < 2000 ? '95' : '87'}%`,
            description: 'Teljesítmény index',
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
                {(stat.title.includes('Teljesítmény') || stat.title.includes('Hatékonyság') || stat.title.includes('Kockázati')) && (
                  <Progress 
                    value={
                      typeof stat.value === 'string' 
                        ? parseInt(stat.value.replace('%', '').replace('ms', '')) || 85
                        : 85
                    } 
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
