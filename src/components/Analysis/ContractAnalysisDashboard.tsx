import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractAnalysis } from '@/types';
import { DashboardOverview } from './DashboardOverview';
import { AnalysisFilters } from './AnalysisFilters';
import { AnalysisListItem } from './AnalysisListItem';
import { AnalysisRiskCharts } from './AnalysisRiskCharts';
import { AnalysisTimeline } from './AnalysisTimeline';
import { BatchAnalysisProcessor } from './BatchAnalysisProcessor';
import { ContractAnalysisResults } from './ContractAnalysisResults';
import { 
  filterAnalyses, 
  sortAnalyses, 
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
  const [selectedAnalysis, setSelectedAnalysis] = useState<ContractAnalysis | null>(null);

  useEffect(() => {
    const rate = calculateCompletionRate(analyses.length);
    setCompletionRate(rate);
  }, [analyses]);

  useEffect(() => {
    let filtered = filterAnalyses(analyses, searchTerm, filterRisk);
    filtered = sortAnalyses(filtered, sortBy);
    setFilteredAnalyses(filtered);
  }, [analyses, searchTerm, filterRisk, sortBy]);

  const handleAnalysisSelect = (analysis: ContractAnalysis) => {
    console.log('Analysis selected:', analysis.id);
    setSelectedAnalysis(analysis);
    if (onAnalysisSelect) {
      onAnalysisSelect(analysis);
    }
  };

  if (selectedAnalysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Elemzés Részletei</h2>
          <button
            onClick={() => setSelectedAnalysis(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Vissza a listához
          </button>
        </div>
        <ContractAnalysisResults analyses={[selectedAnalysis]} />
      </div>
    );
  }

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
            {filteredAnalyses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nincs elérhető elemzés</p>
            ) : (
              filteredAnalyses.map((analysis) => (
                <AnalysisListItem
                  key={analysis.id}
                  analysis={analysis}
                  onClick={() => handleAnalysisSelect(analysis)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <AnalysisRiskCharts analyses={analyses} analysis={analyses[0]} />
        </TabsContent>

        <TabsContent value="timeline">
          <AnalysisTimeline analyses={analyses} analysis={analyses[0]} />
        </TabsContent>

        <TabsContent value="batch">
          <BatchAnalysisProcessor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
