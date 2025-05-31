import React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { optimizedDocumentService } from '@/services/optimizedDocumentService';
import { Activity, Database, Clock, Zap } from 'lucide-react';

export function PerformanceMetrics() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const updateStats = () => {
      setStats(optimizedDocumentService.getPerformanceStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Cache Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cache Teljesítmény</CardTitle>
          <Database className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Hit Rate</span>
              <Badge variant={stats.cache.hitRate > 80 ? "default" : "secondary"}>
                {stats.cache.hitRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={stats.cache.hitRate} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Hits: {stats.cache.hits}</span>
              <span>Items: {stats.cache.totalItems}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Keresési Sor</CardTitle>
          <Activity className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{stats.searchQueue}</div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                stats.isProcessing.search ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`} />
              <span className="text-xs text-gray-500">
                {stats.isProcessing.search ? 'Feldolgozás alatt' : 'Várakozik'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedding Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Embedding Sor</CardTitle>
          <Zap className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{stats.embeddingQueue}</div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                stats.isProcessing.embedding ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'
              }`} />
              <span className="text-xs text-gray-500">
                {stats.isProcessing.embedding ? 'Feldolgozás alatt' : 'Várakozik'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rendszer Állapot</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge 
              variant={
                stats.cache.hitRate > 80 && stats.searchQueue < 5 ? "default" : "secondary"
              }
              className="w-full justify-center"
            >
              {stats.cache.hitRate > 80 && stats.searchQueue < 5 ? 'Optimális' : 'Átlagos'}
            </Badge>
            <div className="text-xs text-gray-500 text-center">
              Cache: {stats.cache.hitRate.toFixed(0)}% | Queue: {stats.searchQueue + stats.embeddingQueue}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
