
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { Activity, Users, Clock, DollarSign, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function RealTimeDashboard() {
  const { data, isLoading, error } = useRealTimeAnalytics(24);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Analytics adatok betöltése sikertelen</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Wifi className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <WifiOff className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Real-time metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Teljesítmény</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.api_performance.avg_response_time.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              {data.api_performance.total_requests} kérés
            </p>
            <div className="mt-2">
              <Progress 
                value={Math.max(0, 100 - data.api_performance.error_rate)} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {data.api_performance.error_rate.toFixed(1)}% hibaarány
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktív Felhasználók</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.user_activity.active_users}</div>
            <p className="text-xs text-muted-foreground">
              {data.user_activity.total_events} esemény
            </p>
            <Badge variant="secondary" className="mt-2">
              Utolsó 24 óra
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendszer Állapot</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.system_health?.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={getStatusColor(service.status)}>
                      {getStatusIcon(service.status)}
                    </span>
                    <span className="text-sm">{service.service}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {service.avg_response_time}ms
                  </span>
                </div>
              )) || <span className="text-sm text-muted-foreground">Nincs adat</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Költségek</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.costs.total_cost.toFixed(2)} Ft</div>
            <p className="text-xs text-muted-foreground">Mai költség</p>
            <div className="mt-2 space-y-1">
              {data.costs.by_service?.slice(0, 2).map((service, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>{service.service}</span>
                  <span>{service.cost.toFixed(2)} Ft</span>
                </div>
              )) || null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Események</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.user_activity.top_events || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event_type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Költség Megoszlás</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.costs.by_service || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ service, cost }) => `${service}: ${cost.toFixed(1)} Ft`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {(data.costs.by_service || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
