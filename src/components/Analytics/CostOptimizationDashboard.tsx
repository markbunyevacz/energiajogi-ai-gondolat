import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { DollarSign, TrendingUp, TrendingDown, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface CostData {
  total: number;
  byService: Array<{ service: string; cost: number; usage: number }>;
  trend: Array<{ date: string; cost: number }>;
  budget: number;
  projectedCost: number;
}

interface OptimizationRecommendation {
  id: string;
  type: 'cost_reduction' | 'efficiency' | 'scaling';
  title: string;
  description: string;
  potential_savings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export function CostOptimizationDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [budgetAlert, setBudgetAlert] = useState<boolean>(false);
  const { trackCost } = useAnalyticsTracking();

  // Fetch cost data
  const { data: costData, isLoading } = useQuery({
    queryKey: ['cost-optimization', selectedTimeRange],
    queryFn: async () => {
      const daysAgo = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      const { data: costs } = await supabase
        .from('cost_tracking')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (!costs) return null;

      // Calculate cost breakdown by service
      const serviceBreakdown = costs.reduce((acc, cost) => {
        const existing = acc.find(s => s.service === cost.service_type);
        if (existing) {
          existing.cost += cost.cost_amount;
          existing.usage += cost.usage_units || 0;
        } else {
          acc.push({
            service: cost.service_type,
            cost: cost.cost_amount,
            usage: cost.usage_units || 0
          });
        }
        return acc;
      }, [] as Array<{ service: string; cost: number; usage: number }>);

      // Calculate daily trends
      const dailyTrends = costs.reduce((acc, cost) => {
        const date = new Date(cost.created_at).toISOString().split('T')[0];
        const existing = acc.find(d => d.date === date);
        if (existing) {
          existing.cost += cost.cost_amount;
        } else {
          acc.push({ date, cost: cost.cost_amount });
        }
        return acc;
      }, [] as Array<{ date: string; cost: number }>);

      const totalCost = costs.reduce((sum, cost) => sum + cost.cost_amount, 0);
      const avgDailyCost = totalCost / daysAgo;
      const projectedMonthlyCost = avgDailyCost * 30;

      return {
        total: totalCost,
        byService: serviceBreakdown,
        trend: dailyTrends,
        budget: 50000, // Mock budget - 50,000 Ft
        projectedCost: projectedMonthlyCost
      } as CostData;
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // Mock optimization recommendations
  const recommendations: OptimizationRecommendation[] = [
    {
      id: '1',
      type: 'cost_reduction',
      title: 'API Cache Optimalizálás',
      description: 'Cache stratégia implementálása 30%-os API költség csökkentéshez',
      potential_savings: 15000,
      effort: 'medium',
      impact: 'high'
    },
    {
      id: '2',
      type: 'efficiency',
      title: 'Batch Processing',
      description: 'Dokumentum feldolgozás batch-ekben a költségek optimalizálásához',
      potential_savings: 8000,
      effort: 'low',
      impact: 'medium'
    },
    {
      id: '3',
      type: 'scaling',
      title: 'Auto-scaling Beállítás',
      description: 'Automatikus skálázás beállítása csúcsidőn kívüli költségek csökkentéséhez',
      potential_savings: 12000,
      effort: 'high',
      impact: 'high'
    }
  ];

  useEffect(() => {
    if (costData && costData.projectedCost > costData.budget) {
      setBudgetAlert(true);
    }
  }, [costData]);

  const calculateROI = (service: string) => {
    // Mock ROI calculation
    const serviceROI: Record<string, number> = {
      'ai_processing': 340,
      'database': 280,
      'api_calls': 150,
      'storage': 200
    };
    return serviceROI[service] || 100;
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-600" />;
      case 'low': return <TrendingDown className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return <div className="p-6">Költség adatok betöltése...</div>;
  }

  if (!costData) {
    return <div className="p-6">Nincs költség adat elérhető</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const budgetUsagePercentage = (costData.projectedCost / costData.budget) * 100;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {(['7d', '30d', '90d'] as const).map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? 'default' : 'outline'}
            onClick={() => setSelectedTimeRange(range)}
            size="sm"
          >
            {range === '7d' ? '7 nap' : range === '30d' ? '30 nap' : '90 nap'}
          </Button>
        ))}
      </div>

      {/* Budget Alert */}
      {budgetAlert && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Figyelem! A projected költség ({costData.projectedCost.toLocaleString()} Ft) 
            meghaladja a havi költségvetést ({costData.budget.toLocaleString()} Ft).
          </AlertDescription>
        </Alert>
      )}

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes Költség</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costData.total.toLocaleString()} Ft</div>
            <p className="text-xs text-muted-foreground">
              Utolsó {selectedTimeRange === '7d' ? '7' : selectedTimeRange === '30d' ? '30' : '90'} nap
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Havi Előrejelzés</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costData.projectedCost.toLocaleString()} Ft</div>
            <Badge variant={budgetUsagePercentage > 100 ? "destructive" : "default"}>
              {budgetUsagePercentage.toFixed(1)}% költségvetésből
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimalizációs Potenciál</CardTitle>
            <Lightbulb className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recommendations.reduce((sum, r) => sum + r.potential_savings, 0).toLocaleString()} Ft
            </div>
            <p className="text-xs text-muted-foreground">Havi megtakarítás</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Átlagos ROI</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">285%</div>
            <p className="text-xs text-muted-foreground">Befektetés megtérülés</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Költség Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} Ft`, 'Költség']} />
                <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Szolgáltatás Költségek</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costData.byService}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ service, cost }) => `${service}: ${cost.toLocaleString()} Ft`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {costData.byService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ROI by Service */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Szolgáltatásonként</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData.byService.map(service => ({
              ...service,
              roi: calculateROI(service.service)
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'ROI']} />
              <Bar dataKey="roi" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimalizációs Javaslatok</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getImpactIcon(rec.impact)}
                  <h4 className="font-semibold">{rec.title}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getEffortColor(rec.effort)}>
                    {rec.effort === 'low' ? 'Alacsony' : rec.effort === 'medium' ? 'Közepes' : 'Magas'} erőfeszítés
                  </Badge>
                  <span className="text-sm font-medium text-green-600">
                    +{rec.potential_savings.toLocaleString()} Ft/hó
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{rec.description}</p>
              <div className="flex justify-between items-center">
                <Badge variant="outline">
                  {rec.type === 'cost_reduction' ? 'Költségcsökkentés' : 
                   rec.type === 'efficiency' ? 'Hatékonyság' : 'Skálázás'}
                </Badge>
                <Button size="sm" variant="outline">
                  Implementálás
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
