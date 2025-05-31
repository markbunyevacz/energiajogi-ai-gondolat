import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock } from 'lucide-react';

export function AnalysisSummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-4 text-center">
          <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">85%</div>
          <div className="text-sm text-gray-600">Megfelelőség</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4 text-center">
          <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">250k</div>
          <div className="text-sm text-gray-600">Becsült megtakarítás (Ft)</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4 text-center">
          <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">2h</div>
          <div className="text-sm text-gray-600">Becsült javítási idő</div>
        </CardContent>
      </Card>
    </div>
  );
}
