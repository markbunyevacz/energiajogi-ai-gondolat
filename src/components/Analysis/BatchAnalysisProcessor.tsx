import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Pause,
  Play,
  StopCircle,
} from 'lucide-react';
import { ContractAnalysis } from '@/types';
import { generateMockRisks, generateMockRecommendations } from './utils/mockDataGenerators';
import { toast } from 'sonner';

interface BatchJob {
  id: string;
  name: string;
  files: File[];
  status: 'pending' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  processedFiles: number;
  totalFiles: number;
  startTime?: Date;
  estimatedCompletion?: Date;
}

export function BatchAnalysisProcessor() {
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [jobName, setJobName] = useState('');
  const [priority, setPriority] = useState('medium');
  const [processingMode, setProcessingMode] = useState('parallel');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ContractAnalysis[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const startBatchJob = (jobId: string) => {
    setBatchJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'running', startTime: new Date() }
        : job
    ));

    // Simulate batch processing
    simulateBatchProcessing(jobId);
  };

  const simulateBatchProcessing = (jobId: string) => {
    const job = batchJobs.find(j => j.id === jobId);
    if (!job) return;

    const interval = setInterval(() => {
      setBatchJobs(prev => prev.map(currentJob => {
        if (currentJob.id !== jobId || currentJob.status !== 'running') {
          return currentJob;
        }

        const newProgress = Math.min(currentJob.progress + Math.random() * 15, 100);
        const newProcessedFiles = Math.floor((newProgress / 100) * currentJob.totalFiles);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          return {
            ...currentJob,
            status: 'completed',
            progress: 100,
            processedFiles: currentJob.totalFiles
          };
        }

        return {
          ...currentJob,
          progress: newProgress,
          processedFiles: newProcessedFiles,
          estimatedCompletion: new Date(Date.now() + ((100 - newProgress) / 10) * 60000)
        };
      }));
    }, 2000);
  };

  const pauseBatchJob = (jobId: string) => {
    setBatchJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'paused' } : job
    ));
  };

  const stopBatchJob = (jobId: string) => {
    setBatchJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const getStatusIcon = (status: BatchJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: BatchJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (status: BatchJob['status']) => {
    switch (status) {
      case 'pending':
        return 'Várakozik';
      case 'running':
        return 'Fut';
      case 'paused':
        return 'Szünetel';
      case 'completed':
        return 'Befejezve';
      case 'error':
        return 'Hiba';
    }
  };

  const formatDuration = (date: Date) => {
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      // Simulate batch processing
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress((i + 1) * 20);

        const newAnalysis: ContractAnalysis = {
          id: Math.random().toString(36).substr(2, 9),
          contractId: `DEMO-${Date.now()}-${i + 1}`,
          riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          risks: generateMockRisks(),
          recommendations: generateMockRecommendations(),
          summary: 'Az AI elemzés befejeződött. A szerződés részletes áttekintése alapján azonosított kockázatok és javaslatok.',
          timestamp: new Date().toISOString()
        };

        setResults(prev => [...prev, newAnalysis]);
      }

      toast.success('Kötegelt elemzés sikeresen befejeződött');
    } catch (error) {
      toast.error('Hiba történt a kötegelt elemzés során', {
        description: 'Kérjük, próbálja újra később'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Új Kötegelt Elemzés</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobName">Feladat Neve</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="pl. Q1 Szerződések Elemzése"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioritás</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Alacsony</SelectItem>
                  <SelectItem value="medium">Közepes</SelectItem>
                  <SelectItem value="high">Magas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Szerződés Fájlok</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {selectedFiles && (
              <p className="text-sm text-gray-600">
                {selectedFiles.length} fájl kiválasztva
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Feldolgozási Mód</Label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="parallel"
                  checked={processingMode === 'parallel'}
                  onChange={(e) => setProcessingMode(e.target.value)}
                />
                <span>Párhuzamos (Gyorsabb)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="sequential"
                  checked={processingMode === 'sequential'}
                  onChange={(e) => setProcessingMode(e.target.value)}
                />
                <span>Szekvenciális (Stabil)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button 
              onClick={handleProcess} 
              disabled={isProcessing}
            >
              {isProcessing ? 'Feldolgozás...' : 'Kötegelt Elemzés Indítása'}
            </Button>
            {isProcessing && (
              <div className="text-sm text-muted-foreground">
                {progress}% kész
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {batchJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktív Feladatok ({batchJobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batchJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <h4 className="font-medium">{job.name}</h4>
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {job.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseBatchJob(job.id)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      {job.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startBatchJob(job.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopBatchJob(job.id)}
                      >
                        <StopCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Progress value={job.progress} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{job.processedFiles}/{job.totalFiles} fájl feldolgozva</span>
                    <span>{Math.round(job.progress)}% befejezve</span>
                  </div>

                  {job.status === 'running' && job.estimatedCompletion && (
                    <div className="text-xs text-gray-500">
                      Becsült befejezés: {job.estimatedCompletion.toLocaleTimeString('hu-HU')}
                      {job.startTime && ` • Futási idő: ${formatDuration(job.startTime)}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Elemzési Eredmények</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div 
                  key={result.id}
                  className="p-4 rounded-lg border bg-card text-card-foreground"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Szerződés #{result.contractId}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      Kockázati szint: {result.riskLevel}
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{result.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
