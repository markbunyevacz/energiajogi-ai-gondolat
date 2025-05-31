import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserBehaviorTracking } from '@/hooks/useUserBehaviorTracking';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Activity, Play, Pause } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ABVariant[];
  metrics: ABMetric[];
  startDate?: Date;
  endDate?: Date;
  sampleSize: number;
  currentSample: number;
  confidence: number;
  significanceLevel: number;
}

interface ABVariant {
  id: string;
  name: string;
  description: string;
  traffic_percentage: number;
  conversions: number;
  views: number;
  conversion_rate: number;
}

interface ABMetric {
  name: string;
  type: 'conversion' | 'engagement' | 'revenue';
  primary: boolean;
}

export function ABTestingFramework() {
  const [activeTest, setActiveTest] = useState<ABTest | null>(null);
  const [tests, setTests] = useState<ABTest[]>([]);
  const { trackConversionEvent, trackFeatureUsage } = useUserBehaviorTracking();
  const { trackUserAction } = useAnalyticsTracking();

  // Mock A/B tests data
  useEffect(() => {
    const mockTests: ABTest[] = [
      {
        id: 'test_1',
        name: 'Új Dashboard Layout',
        description: 'A dashboard layout A/B tesztje a felhasználói engagement növelésére',
        status: 'running',
        variants: [
          {
            id: 'control',
            name: 'Kontrol (Jelenlegi)',
            description: 'Jelenlegi dashboard design',
            traffic_percentage: 50,
            conversions: 145,
            views: 1250,
            conversion_rate: 11.6
          },
          {
            id: 'variant_a',
            name: 'Új Design',
            description: 'Optimalizált layout újabb elemekkel',
            traffic_percentage: 50,
            conversions: 178,
            views: 1180,
            conversion_rate: 15.1
          }
        ],
        metrics: [
          { name: 'Feature Usage', type: 'engagement', primary: true },
          { name: 'Session Duration', type: 'engagement', primary: false },
          { name: 'Task Completion', type: 'conversion', primary: true }
        ],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        sampleSize: 3000,
        currentSample: 2430,
        confidence: 95,
        significanceLevel: 0.05
      },
      {
        id: 'test_2',
        name: 'Kérdés-Válasz UX',
        description: 'A Q&A komponens user experience optimalizálása',
        status: 'completed',
        variants: [
          {
            id: 'control',
            name: 'Alap UX',
            description: 'Eredeti user interface',
            traffic_percentage: 50,
            conversions: 89,
            views: 890,
            conversion_rate: 10.0
          },
          {
            id: 'variant_b',
            name: 'Javított UX',
            description: 'Streamlined user experience',
            traffic_percentage: 50,
            conversions: 112,
            views: 856,
            conversion_rate: 13.1
          }
        ],
        metrics: [
          { name: 'Question Submission', type: 'conversion', primary: true },
          { name: 'User Satisfaction', type: 'engagement', primary: true }
        ],
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        sampleSize: 2000,
        currentSample: 1746,
        confidence: 95,
        significanceLevel: 0.05
      }
    ];

    setTests(mockTests);
    setActiveTest(mockTests[0]);
  }, []);

  const calculateStatisticalSignificance = (variantA: ABVariant, variantB: ABVariant) => {
    // Simplified significance calculation
    const diff = Math.abs(variantA.conversion_rate - variantB.conversion_rate);
    const avgRate = (variantA.conversion_rate + variantB.conversion_rate) / 2;
    return diff > (avgRate * 0.1) ? 'significant' : 'not_significant';
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTestAction = (action: 'start' | 'pause' | 'stop' | 'reset', testId: string) => {
    trackUserAction('ab_test_action', {
      action,
      testId,
      timestamp: Date.now()
    });

    // Update test status
    setTests(prev => prev.map(test => {
      if (test.id === testId) {
        const newStatus = action === 'start' ? 'running' : 
                         action === 'pause' ? 'paused' : 
                         action === 'stop' ? 'completed' : 'draft';
        return { ...test, status: newStatus };
      }
      return test;
    }));
  };

  const trackTestConversion = (testId: string, variantId: string, metricName: string) => {
    trackConversionEvent(`ab_test_${testId}_${variantId}_${metricName}`);
    trackFeatureUsage('ab_test_conversion', { testId, variantId, metricName });
  };

  if (!activeTest) {
    return <div className="p-6">Nincs aktív A/B teszt</div>;
  }

  const winner = activeTest.variants.reduce((prev, current) => 
    current.conversion_rate > prev.conversion_rate ? current : prev
  );

  const significance = calculateStatisticalSignificance(activeTest.variants[0], activeTest.variants[1]);
  const progressPercentage = (activeTest.currentSample / activeTest.sampleSize) * 100;

  return (
    <div className="space-y-6">
      {/* Test Selection */}
      <div className="flex space-x-2">
        {tests.map((test) => (
          <Button
            key={test.id}
            variant={activeTest.id === test.id ? 'default' : 'outline'}
            onClick={() => setActiveTest(test)}
            size="sm"
          >
            {test.name}
          </Button>
        ))}
      </div>

      {/* Test Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{activeTest.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{activeTest.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getTestStatusColor(activeTest.status)}>
                {activeTest.status === 'running' ? 'Futó' : 
                 activeTest.status === 'completed' ? 'Befejezett' : 
                 activeTest.status === 'paused' ? 'Szüneteltetve' : 'Tervezet'}
              </Badge>
              {activeTest.status === 'running' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleTestAction('pause', activeTest.id)}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Szünet
                </Button>
              )}
              {activeTest.status === 'paused' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleTestAction('start', activeTest.id)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Folytatás
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{activeTest.currentSample.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Minta méret</div>
              <Progress value={progressPercentage} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{activeTest.confidence}%</div>
              <div className="text-sm text-gray-600">Megbízhatóság</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {significance === 'significant' ? '✓' : '⧖'}
              </div>
              <div className="text-sm text-gray-600">
                {significance === 'significant' ? 'Szignifikáns' : 'Folyamatban'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{winner.name}</div>
              <div className="text-sm text-gray-600">Vezető variáns</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variant Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeTest.variants.map((variant) => (
          <Card key={variant.id} className={winner.id === variant.id ? 'ring-2 ring-green-500' : ''}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{variant.name}</CardTitle>
                {winner.id === variant.id && (
                  <Badge className="bg-green-100 text-green-800">Vezető</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{variant.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{variant.conversion_rate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Konverziós ráta</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{variant.conversions}</div>
                  <div className="text-sm text-gray-600">Konverziók</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nézetek:</span>
                  <span>{variant.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Forgalom:</span>
                  <span>{variant.traffic_percentage}%</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => trackTestConversion(activeTest.id, variant.id, 'manual_test')}
              >
                Test Konverzió
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Konverziós Ráta Összehasonlítás</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeTest.variants}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Konverziós ráta']} />
              <Bar dataKey="conversion_rate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Test Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Teszt Metrikák</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTest.metrics.map((metric, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {metric.type === 'conversion' ? <Target className="h-5 w-5 text-green-600" /> :
                   metric.type === 'engagement' ? <Activity className="h-5 w-5 text-blue-600" /> :
                   <TrendingUp className="h-5 w-5 text-purple-600" />}
                </div>
                <div className="font-semibold">{metric.name}</div>
                <div className="text-sm text-gray-600">
                  {metric.type === 'conversion' ? 'Konverzió' : 
                   metric.type === 'engagement' ? 'Engagement' : 'Bevétel'}
                </div>
                {metric.primary && (
                  <Badge variant="outline" className="mt-2">Elsődleges</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
