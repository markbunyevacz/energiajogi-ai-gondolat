
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/components/Auth/Login';
import { Header } from '@/components/Layout/Header';
import { DashboardStatsComponent } from '@/components/Dashboard/DashboardStats';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';
import { DocumentUpload } from '@/components/Documents/DocumentUpload';
import { QuestionAnswer } from '@/components/QA/QuestionAnswer';
import { ContractAnalysisComponent } from '@/components/Analysis/ContractAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Zap, FileText, MessageSquare, Shield, Users, TrendingUp, Sparkles } from 'lucide-react';
import { DashboardStats } from '@/types';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const mockStats: DashboardStats = {
    totalDocuments: 1247,
    recentQueries: 89,
    contractsAnalyzed: 34,
    riskScore: 25,
    costSavings: 450,
    apiUsage: 85,
    userActivity: 24
  };

  useEffect(() => {
    if (user) {
      // Add fade-in animation to dashboard
      document.body.style.opacity = '0';
      setTimeout(() => {
        document.body.style.transition = 'opacity 0.3s ease-in';
        document.body.style.opacity = '1';
      }, 100);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-mav-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Welcome Banner */}
            <Card className="gradient-bg text-white border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold">
                      Üdvözöljük, {user.name}!
                    </h1>
                    <p className="text-white/90">
                      {user.role === 'jogász' && 'Jogi elemzések és dokumentumkeresés központja'}
                      {user.role === 'it_vezető' && 'Rendszer teljesítmény és technikai metrikák'}
                      {user.role === 'tulajdonos' && 'Üzleti mutatók és ROI elemzés'}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-white/80">Rendszer státusz</div>
                      <Badge className="bg-green-500 text-white">Működőképes</Badge>
                    </div>
                    <Sparkles className="w-8 h-8 text-white/80" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role-specific Welcome Message */}
            <Alert className="border-mav-blue bg-blue-50">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                {user.role === 'jogász' && (
                  <>
                    <strong>Jogász módban:</strong> Hozzáférése van a teljes dokumentumadatbázishoz, 
                    jogi Q&A funkcióhoz és részletes szerződéselemzéshez. Kezdje egy kérdés feltevésével 
                    vagy dokumentum keresésével.
                  </>
                )}
                {user.role === 'it_vezető' && (
                  <>
                    <strong>IT Vezető módban:</strong> Láthatja a rendszer teljesítmény metrikákat, 
                    API használatot és technikai mutatókat. Monitorozhatja a rendszer egészségét és optimalizálhatja a működést.
                  </>
                )}
                {user.role === 'tulajdonos' && (
                  <>
                    <strong>Tulajdonos módban:</strong> Hozzáférése van az üzleti mutatókhoz, 
                    ROI számításokhoz és költségmegtakarítási jelentésekhez. Láthatja a rendszer üzleti értékét.
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Dashboard Stats */}
            <DashboardStatsComponent role={user.role} stats={mockStats} />

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivity role={user.role} />
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-mav-blue" />
                    <span>Gyors Műveletek</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setCurrentPage('documents')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Dokumentum Feltöltése
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setCurrentPage('qa')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Jogi Kérdés Feltevése
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setCurrentPage('analysis')}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Szerződés Elemzése
                  </Button>
                  
                  {user.role === 'tulajdonos' && (
                    <div className="pt-3 border-t">
                      <div className="text-sm text-gray-600 mb-2">Üzleti mutatók</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Havi ROI:</span>
                          <span className="font-medium text-green-600">+340%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Költségmegtakarítás:</span>
                          <span className="font-medium text-green-600">450k Ft</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Demo Information */}
            <Card className="border-dashed border-2 border-mav-blue bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-mav-blue">
                  <Users className="w-5 h-5" />
                  <span>DEMO Információk</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-mav-blue">1,247</div>
                    <div className="text-sm text-gray-600">Előre feltöltött dokumentum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-mav-blue">Claude AI</div>
                    <div className="text-sm text-gray-600">Anthropic AI motor</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-mav-blue">99.8%</div>
                    <div className="text-sm text-gray-600">Válasz pontosság</div>
                  </div>
                </div>
                
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Ez egy működő DEMO verzió. Az energiajogi dokumentumok előre feltöltve, 
                    a Claude AI válaszokat ad valós kérdésekre, és a szerződéselemzés működőképes. 
                    Próbálja ki az összes funkciót!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Dokumentumkezelés</h1>
              <p className="text-gray-600">
                Energiajogi dokumentumok feltöltése, keresése és kezelése
              </p>
            </div>
            <DocumentUpload />
          </div>
        );

      case 'qa':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Jogi Q&A Asszisztens</h1>
              <p className="text-gray-600">
                Tegyen fel energiajogi kérdéseket és kapjon AI-alapú válaszokat
              </p>
            </div>
            <QuestionAnswer />
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Szerződéselemzés</h1>
              <p className="text-gray-600">
                Energiajogi szerződések automatikus elemzése és kockázatértékelése
              </p>
            </div>
            <ContractAnalysisComponent />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
