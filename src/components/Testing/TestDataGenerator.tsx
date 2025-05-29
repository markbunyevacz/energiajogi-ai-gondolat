
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import { toast } from 'sonner';
import { TestDataProgress } from './components/TestDataProgress';
import { TestDataStats } from './components/TestDataStats';
import { TestDataDescription } from './components/TestDataDescription';
import {
  generateTestDocuments,
  generateQASessions,
  generateContractAnalyses,
  generatePerformanceMetrics,
  generateAnalyticsEvents
} from './utils/testDataGenerators';

export function TestDataGenerator() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedData, setGeneratedData] = useState<any>({});

  const generateTestData = async () => {
    if (!user) {
      toast.error('Nincs bejelentkezett felhasználó');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    
    try {
      console.log('Starting test data generation for user:', user.id);
      toast.info('Teszt adatok generálása elkezdődött...');

      // 1. Generate test documents (20%)
      setProgress(20);
      const testDocuments = await generateTestDocuments(user.id);
      console.log('Generated documents:', testDocuments);
      
      // 2. Generate QA sessions (40%)
      setProgress(40);
      const qaSessions = await generateQASessions(user.id);
      console.log('Generated QA sessions:', qaSessions);
      
      // 3. Generate contract analyses (60%)
      setProgress(60);
      const contractAnalyses = await generateContractAnalyses(user.id);
      console.log('Generated contract analyses:', contractAnalyses);
      
      // 4. Generate performance metrics (80%)
      setProgress(80);
      const performanceData = await generatePerformanceMetrics();
      console.log('Generated performance data:', performanceData);
      
      // 5. Generate analytics events (100%)
      setProgress(100);
      const analyticsData = await generateAnalyticsEvents(user.id);
      console.log('Generated analytics data:', analyticsData);

      setGeneratedData({
        documents: testDocuments,
        qaSessions: qaSessions,
        contracts: contractAnalyses,
        performance: performanceData,
        analytics: analyticsData
      });

      toast.success('Teszt adatok sikeresen generálva!');
      
    } catch (error) {
      console.error('Error generating test data:', error);
      toast.error(`Hiba a teszt adatok generálása során: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Teszt Adatok Generálása
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TestDataStats generatedData={generatedData} />
        
        <TestDataProgress isGenerating={isGenerating} progress={progress} />

        <Button 
          onClick={generateTestData}
          disabled={isGenerating}
          className="w-full"
        >
          <Database className="w-4 h-4 mr-2" />
          Teszt Adatok Generálása
        </Button>

        <TestDataDescription />
      </CardContent>
    </Card>
  );
}
