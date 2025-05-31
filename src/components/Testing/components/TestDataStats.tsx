import React from 'react';
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, BarChart3, Users } from 'lucide-react';

interface TestDataStatsProps {
  generatedData: any;
}

export function TestDataStats({ generatedData }: TestDataStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="text-center">
        <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
        <p className="text-sm font-medium">Dokumentumok</p>
        <Badge variant="outline">{generatedData.documents?.length || 0}</Badge>
      </div>
      
      <div className="text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-green-500" />
        <p className="text-sm font-medium">QA Session-ök</p>
        <Badge variant="outline">{generatedData.qaSessions?.length || 0}</Badge>
      </div>
      
      <div className="text-center">
        <FileText className="w-8 h-8 mx-auto mb-2 text-purple-500" />
        <p className="text-sm font-medium">Szerződések</p>
        <Badge variant="outline">{generatedData.contracts?.length || 0}</Badge>
      </div>
      
      <div className="text-center">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-orange-500" />
        <p className="text-sm font-medium">Metrikák</p>
        <Badge variant="outline">{generatedData.performance?.length || 0}</Badge>
      </div>
      
      <div className="text-center">
        <Users className="w-8 h-8 mx-auto mb-2 text-red-500" />
        <p className="text-sm font-medium">Analytics</p>
        <Badge variant="outline">{generatedData.analytics?.length || 0}</Badge>
      </div>
    </div>
  );
}
