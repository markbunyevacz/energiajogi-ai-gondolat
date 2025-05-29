
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractAnalysis } from '@/types';
import { DashboardOverview } from './DashboardOverview';
import { AnalysisFilters } from './AnalysisFilters';
import { AnalysisListItem } from './AnalysisListItem';
import { AnalysisRiskCharts } from './AnalysisRiskCharts';
import { AnalysisTimeline } from './AnalysisTimeline';
import { BatchAnalysisProcessor } from './BatchAnalysisProcessor';
import { 
  filterAnalyses, 
  sortAnalyses, 
  exportAnalysis, 
  calculateCompletionRate 
} from './DashboardUtils';

interface ContractAnalysisDashboardProps {
  analyses: ContractAnalysis[];
  onAnalysisSelect?: (analysis: ContractAnalysis) => void;
}

export function ContractAnalysisDashboard({ analyses, onAnalysisSelect }: ContractAnalysisDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [filteredAnalyses, setFilteredAnalyses] = useState<ContractAnalysis[]>(analyses);
  const [completionRate, setCompletionRate] = useState<number>(0);

  useEffect(() => {
    const rate = calculateCompletionRate(analyses.length);
    setCompletionRate(rate);
  }, [analyses]);

  useEffect(() => {
    let filtered = filterAnalyses(analyses, searchTerm, filterRisk);
    filtered = sortAnalyses(filtered, sortBy);
    setFilteredAnalyses(filtered);
  }, [analyses, searchTerm, filterRisk, sortBy]);

  return (
    <div className="space-y-6">
      <DashboardOverview analyses={analyses} completionRate={completionRate} />

      <Tabs defaultValue="analyses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analyses">Elemzések</TabsTrigger>
          <TabsTrigger value="charts">Grafikonok</TabsTrigger>
          <TabsTrigger value="timeline">Idősor</TabsTrigger>
          <TabsTrigger value="batch">Kötegelt Feldolgozás</TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="space-y-4">
          <AnalysisFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterRisk={filterRisk}
            onFilterRiskChange={setFilterRisk}
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />

          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <AnalysisListItem
                key={analysis.id}
                analysis={analysis}
                onSelect={onAnalysisSelect}
                onExport={exportAnalysis}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <AnalysisRiskCharts analyses={analyses} />
        </TabsContent>

        <TabsContent value="timeline">
          <AnalysisTimeline analyses={analyses} />
        </TabsContent>

        <TabsContent value="batch">
          <BatchAnalysisProcessor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
