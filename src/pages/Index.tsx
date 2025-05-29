
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Header } from "@/components/Layout/Header";
import { DashboardStatsComponent } from "@/components/Dashboard/DashboardStats";
import { RecentActivity } from "@/components/Dashboard/RecentActivity";
import { QuestionAnswer } from "@/components/QA/QuestionAnswer";
import { DocumentUpload } from "@/components/Documents/DocumentUpload";
import { ITDashboard } from "@/components/Dashboard/ITDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { useEffect } from "react";
import { ProactiveRecommendations } from "@/components/AI/ProactiveRecommendations";

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

  // Determine tab configuration based on user role
  const getTabConfig = () => {
    const isITOrOwner = profile?.role === 'it_vezető' || profile?.role === 'tulajdonos';
    
    if (isITOrOwner) {
      return {
        defaultTab: 'qa',
        tabs: [
          { value: 'qa', label: 'Kérdés-Válasz' },
          { value: 'upload', label: 'Dokumentumok' },
          { value: 'recommendations', label: 'AI Javaslatok' },
          { value: 'it-dashboard', label: 'IT Dashboard' },
          { value: 'activity', label: 'Aktivitás' }
        ]
      };
    }
    
    return {
      defaultTab: 'qa',
      tabs: [
        { value: 'qa', label: 'Kérdés-Válasz' },
        { value: 'upload', label: 'Dokumentumok' },
        { value: 'recommendations', label: 'AI Javaslatok' },
        { value: 'activity', label: 'Aktivitás' }
      ]
    };
  };

  const tabConfig = getTabConfig();

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
                {profile?.role === 'jogász' && 'Jogi AI asszisztens - Intelligens ágensek és proaktív javaslatok'}
                {profile?.role === 'it_vezető' && 'IT vezető dashboard - Rendszer monitoring és teljesítmény követés'}
                {profile?.role === 'tulajdonos' && 'Tulajdonos áttekintés - Üzleti metrikák és rendszer állapot'}
              </p>
            </div>

            {/* Dashboard Stats */}
            {stats && (
              <DashboardStatsComponent 
                role={profile?.role || 'jogász'} 
                stats={stats}
              />
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue={tabConfig.defaultTab} className="space-y-6">
              <TabsList className={`grid w-full max-w-2xl ${tabConfig.tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
                {tabConfig.tabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="qa" className="space-y-6">
                <QuestionAnswer />
              </TabsContent>

              <TabsContent value="upload" className="space-y-6">
                <DocumentUpload />
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <ProactiveRecommendations />
              </TabsContent>

              {(profile?.role === 'it_vezető' || profile?.role === 'tulajdonos') && (
                <TabsContent value="it-dashboard" className="space-y-6">
                  <ITDashboard role={profile?.role || 'jogász'} />
                </TabsContent>
              )}

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
