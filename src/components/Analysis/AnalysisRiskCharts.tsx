import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { ContractAnalysis, Risk } from '@/types';
import { TrendingUp, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';

interface AnalysisRiskChartsProps {
  analysis: ContractAnalysis;
  analyses?: ContractAnalysis[];
}

export function AnalysisRiskCharts({ analysis, analyses = [] }: AnalysisRiskChartsProps) {
  const risks = analysis.risks || [];
  
  const risksByType = risks.reduce((acc, risk) => {
    const type = risk.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(risk);
    return acc;
  }, {} as Record<string, Risk[]>);

  const chartData = Object.entries(risksByType).map(([type, risks]) => ({
    name: type,
    value: risks.length
  }));

  const COLORS = {
    legal: '#FF8042',
    financial: '#0088FE',
    operational: '#00C49F'
  };

  // Calculate risk level distribution
  const riskLevelData = [
    { name: 'Magas', value: risks.filter(r => r.level === 'high').length, color: '#ef4444' },
    { name: 'Közepes', value: risks.filter(r => r.level === 'medium').length, color: '#f59e0b' },
    { name: 'Alacsony', value: risks.filter(r => r.level === 'low').length, color: '#10b981' }
  ];

  // Generate timeline data
  const timelineData = analyses.map(analysis => ({
    date: new Date(analysis.timestamp || analysis.created_at).toLocaleDateString('hu-HU'),
    risks: analysis.risks.length,
    riskLevel: analysis.risks.reduce((acc, risk) => {
      const levelValue = risk.level === 'high' ? 3 : risk.level === 'medium' ? 2 : 1;
      return acc + levelValue;
    }, 0) / analysis.risks.length
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
                {riskLevelData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`}
                    fill={entry.color} 
                  />
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
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS]} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
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
