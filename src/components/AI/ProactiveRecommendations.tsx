
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, CheckCircle, AlertTriangle, Info, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { proactiveAnalysisService, ProactiveRecommendation } from '@/services/proactiveAnalysis';

export function ProactiveRecommendations() {
  const [recommendations, setRecommendations] = useState<ProactiveRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const recs = await proactiveAnalysisService.generateRecommendations(user.id);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <Info className="w-4 h-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'contract_review': 'Szerződés áttekintés',
      'compliance_alert': 'Megfelelőségi figyelmeztetés',
      'legal_update': 'Jogi változás',
      'risk_assessment': 'Kockázatértékelés'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mav-blue"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-mav-blue" />
            <span>Proaktív Javaslatok</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Jelenleg nincsenek új javaslatok. Az AI folyamatosan figyeli a dokumentumokat és értesíti a fontos változásokról.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-mav-blue" />
          <span>Proaktív Javaslatok</span>
          <Badge variant="secondary">{recommendations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getPriorityIcon(rec.priority)}
                <h4 className="font-medium text-gray-900">{rec.title}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {getTypeLabel(rec.type)}
                </Badge>
                <Badge className={getPriorityColor(rec.priority)}>
                  {rec.priority === 'high' ? 'Sürgős' : 
                   rec.priority === 'medium' ? 'Fontos' : 'Alacsony'}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">{rec.description}</p>
            
            {rec.relatedDocuments.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>{rec.relatedDocuments.length} kapcsolódó dokumentum</span>
              </div>
            )}
            
            {rec.actionable && (
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Részletek megtekintése
                </Button>
                <Button size="sm" className="bg-mav-blue hover:bg-mav-blue-dark">
                  Művelet végrehajtása
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
