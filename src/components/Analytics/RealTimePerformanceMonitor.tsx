import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { websocketService } from '@/services/websocketService';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceMetric {
  timestamp: number;
  responseTime: number;
  status: 'healthy' | 'warning' | 'error';
  endpoint?: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export function RealTimePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const { trackSystemHealth } = useAnalyticsTracking();

  useEffect(() => {
    setConnectionStatus('connecting');
    websocketService.connect();

    const unsubscribeMetrics = websocketService.subscribe('performance_metric', (data: PerformanceMetric) => {
      setMetrics(prev => {
        const newMetrics = [...prev, data].slice(-50); // Keep last 50 metrics
        return newMetrics;
      });

      // Track system health based on response time
      const status = data.responseTime > 5000 ? 'error' : data.responseTime > 2000 ? 'warning' : 'healthy';
      trackSystemHealth('api', status, data.responseTime);

      // Generate alerts for performance issues
      if (data.responseTime > 5000) {
        const alert: SystemAlert = {
          id: `alert_${Date.now()}`,
          type: 'error',
          message: `High response time detected: ${data.responseTime}ms on ${data.endpoint || 'API'}`,
          timestamp: Date.now()
        };
        setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      }
    });

    const unsubscribeAlerts = websocketService.subscribe('system_alert', (alert: SystemAlert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]);
    });

    // Simulate real-time data (remove in production)
    const simulateData = setInterval(() => {
      const mockMetric: PerformanceMetric = {
        timestamp: Date.now(),
        responseTime: Math.random() * 3000 + 500,
        status: Math.random() > 0.9 ? 'warning' : 'healthy',
        endpoint: '/api/data'
      };
      
      setMetrics(prev => [...prev, mockMetric].slice(-50));
      setConnectionStatus('connected');
    }, 2000);

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
      clearInterval(simulateData);
      websocketService.disconnect();
    };
  }, [trackSystemHealth]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const avgResponseTime = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length)
    : 0;

  const chartData = metrics.slice(-20).map((metric, index) => ({
    time: index,
    responseTime: Math.round(metric.responseTime)
  }));

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' : 
          connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <span className="text-sm text-gray-600">
          {connectionStatus === 'connected' ? 'Valós idejű kapcsolat aktív' : 
           connectionStatus === 'connecting' ? 'Csatlakozás...' : 'Kapcsolat megszakadt'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Real-time Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Átlagos Válaszidő</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}ms</div>
            <Badge variant={avgResponseTime > 2000 ? "destructive" : "default"} className="mt-2">
              {avgResponseTime > 2000 ? 'Lassú' : 'Gyors'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktív Kérések</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.length}</div>
            <p className="text-xs text-muted-foreground">Utolsó 2 percben</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendszer Állapot</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon('healthy')}
              <span className="text-sm font-medium">Egészséges</span>
            </div>
            <p className="text-xs text-muted-foreground">Minden szolgáltatás működik</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riasztások</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">Aktív riasztás</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Valós Idejű Teljesítmény</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value}ms`, 'Válaszidő']}
                labelFormatter={(label) => `Mérés #${label + 1}`}
              />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rendszer Riasztások</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>{alert.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
