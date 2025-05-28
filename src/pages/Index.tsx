
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Header } from "@/components/Layout/Header";
import { DashboardStatsComponent } from "@/components/Dashboard/DashboardStats";
import { RecentActivity } from "@/components/Dashboard/RecentActivity";
import { QuestionAnswer } from "@/components/QA/QuestionAnswer";
import { DocumentUpload } from "@/components/Documents/DocumentUpload";
import { RealTimeDashboard } from "@/components/Analytics/RealTimeDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { useEffect } from "react";

const Index = () => {
  const { user, profile } = useAuth();
  const { trackPageView } = useAnalyticsTracking();

  useEffect(() => {
    trackPageView('/');
  }, [trackPageView]);

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Fetch various statistics
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .limit(1000);
      
      const { data: qaRecent } = await supabase
        .from('qa_sessions')
        .select('id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1000);
      
      const { data: contracts } = await supabase
        .from('contract_analyses')
        .select('id')
        .limit(1000);

      return {
        totalDocuments: documents?.length || 0,
        recentQueries: qaRecent?.length || 0,
        contractsAnalyzed: contracts?.length || 0,
        riskScore: 25, // This could be calculated from actual risk data
        apiUsage: 85,
        userActivity: 24,
        costSavings: 450
      };
    },
    enabled: !!user
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Üdvözöljük, {profile?.name || 'Felhasználó'}!
              </h1>
              <p className="text-gray-600 mt-2">
                {profile?.role === 'jogász' && 'Jogi AI asszisztens - Dokumentumok elemzése és kérdések megválaszolása'}
                {profile?.role === 'it_vezető' && 'IT vezető dashboard - Rendszer teljesítmény és metrikák'}
                {profile?.role === 'tulajdonos' && 'Tulajdonos áttekintés - Business metrikák és ROI'}
              </p>
            </div>

            {/* Dashboard Stats */}
            {stats && (
              <DashboardStatsComponent 
                role={profile?.role || 'jogász'} 
                stats={stats}
              />
            )}

            {/* Real-time Analytics for IT Leaders and Owners */}
            {(profile?.role === 'it_vezető' || profile?.role === 'tulajdonos') && (
              <Card>
                <CardHeader>
                  <CardTitle>Valós Idejű Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <RealTimeDashboard />
                </CardContent>
              </Card>
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue="qa" className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="qa">Kérdés-Válasz</TabsTrigger>
                <TabsTrigger value="upload">Dokumentumok</TabsTrigger>
                <TabsTrigger value="activity">Aktivitás</TabsTrigger>
              </TabsList>

              <TabsContent value="qa" className="space-y-6">
                <QuestionAnswer />
              </TabsContent>

              <TabsContent value="upload" className="space-y-6">
                <DocumentUpload />
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <RecentActivity role={profile?.role || 'jogász'} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
