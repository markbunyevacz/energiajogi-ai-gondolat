import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { TestResult } from './types';

interface TestResultsListProps {
  results: TestResult[];
}

export function TestResultsList({ results }: TestResultsListProps) {
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🚀</div>
            <div>
              <p className="text-lg font-medium">Készen állunk a teljes körű tesztelésre!</p>
              <p className="text-sm text-gray-500 mt-2">
                Kattintson a "TELJES TESZTELÉSI TERV" gombra a komprehenzív validáció indításához
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {results.map(result => (
        <Card key={result.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <h3 className="font-medium">{result.testName}</h3>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {result.duration && (
                  <span className="text-xs text-gray-500">
                    {result.duration}ms
                  </span>
                )}
                <Badge 
                  variant="outline" 
                  className={getStatusColor(result.status)}
                >
                  {result.status}
                </Badge>
              </div>
            </div>
            
            {result.details && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-700">{key}: </span>
                      <span className="text-gray-600">
                        {typeof value === 'number' && value < 1 ? 
                          (value * 100).toFixed(1) + '%' : 
                          String(value)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
