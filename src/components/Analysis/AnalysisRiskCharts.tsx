import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { ContractAnalysis } from '@/types';
import { TrendingUp, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';

interface AnalysisRiskChartsProps {
  analyses: ContractAnalysis[];
}

interface ChartData {
  name: string;
  value: number;
}

export function AnalysisRiskCharts({ analyses }: AnalysisRiskChartsProps) {
  // Prepare data for risk level distribution
  const riskLevelData = [
    { name: 'Alacsony', value: analyses.filter(a => a.riskLevel === 'low').length, color: '#10B981' },
    { name: 'Közepes', value: analyses.filter(a => a.riskLevel === 'medium').length, color: '#F59E0B' },
    { name: 'Magas', value: analyses.filter(a => a.riskLevel === 'high').length, color: '#EF4444' }
  ];

  // Prepare data for risk types
  const riskTypeData = analyses.reduce((acc, analysis) => {
    analysis.risks.forEach(risk => {
      const existing = acc.find(item => item.name === risk.type);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ 
          name: risk.type === 'legal' ? 'Jogi' : risk.type === 'financial' ? 'Pénzügyi' : 'Működési', 
          value: 1 
        });
      }
    });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Prepare timeline data
  const timelineData = analyses
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((analysis, index) => ({
      date: new Date(analysis.timestamp).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
      risks: analysis.risks.length,
      riskLevel: analysis.riskLevel === 'high' ? 3 : analysis.riskLevel === 'medium' ? 2 : 1
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Risk Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-blue-600" />
            <span>Kockázati Szint Eloszlás</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskLevelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskLevelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChartIcon className="w-5 h-5 text-green-600" />
            <span>Kockázat Típusok</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span>Elemzési Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="risks" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Kockázatok száma"
              />
              <Line 
                type="monotone" 
                dataKey="riskLevel" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Átlagos kockázati szint"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
