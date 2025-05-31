import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, Shield, Zap, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { proactiveAnalysisService, ProactiveRecommendation } from '@/services/proactiveAnalysis';

export function ProactiveRecommendations() {
  const [recommendations, setRecommendations] = useState<ProactiveRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await proactiveAnalysisService.generateRecommendations(user.id);
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'efficiency':
        return <Zap className="w-4 h-4" />;
      case 'risk':
        return <Shield className="w-4 h-4" />;
      case 'compliance':
        return <Shield className="w-4 h-4" />;
      case 'opportunity':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const handleRecommendationClick = async (recommendation: ProactiveRecommendation) => {
    if (user) {
      await proactiveAnalysisService.trackRecommendationClick(recommendation.id, user.id);
    }
    
    if (recommendation.actionUrl) {
      window.location.href = recommendation.actionUrl;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-mav-blue" />
          <span>Proaktív Javaslatok</span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Jelenleg nincsenek elérhető javaslatok. Használja többet a rendszert a személyre szabott ajánlásokért.
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getCategoryIcon(recommendation.category)}
                      <h3 className="font-medium text-gray-900">{recommendation.title}</h3>
                      <Badge className={getPriorityColor(recommendation.priority)}>
                        {recommendation.priority === 'high' ? 'Magas' : 
                         recommendation.priority === 'medium' ? 'Közepes' : 'Alacsony'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {recommendation.description}
                    </p>
                    {recommendation.estimatedImpact && (
                      <p className="text-xs text-mav-blue font-medium">
                        Várható hatás: {recommendation.estimatedImpact}
                      </p>
                    )}
                  </div>
                  {recommendation.actionUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecommendationClick(recommendation)}
                      className="ml-4"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Megnyitás
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
