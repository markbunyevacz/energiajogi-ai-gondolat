import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  session_id?: string;
}

export function useAnalyticsTracking() {
  const { user } = useAuth();

  const trackEvent = async (event: AnalyticsEvent) => {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: user?.id || null,
          event_type: event.event_type,
          event_data: event.event_data || {},
          session_id: event.session_id || generateSessionId(),
          user_agent: navigator.userAgent,
        });

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const trackPageView = (page: string) => {
    trackEvent({
      event_type: 'page_view',
      event_data: { page, timestamp: new Date().toISOString() }
    });
  };

  const trackUserAction = (action: string, data?: Record<string, any>) => {
    trackEvent({
      event_type: 'user_action',
      event_data: { action, ...data }
    });
  };

  const trackPerformance = async (metric_type: string, value: number, metadata?: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          metric_type,
          metric_value: value,
          metadata: metadata || {}
        });

      if (error) {
        console.error('Performance tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  };

  const trackSystemHealth = async (service_name: string, status: string, response_time_ms?: number, error_message?: string) => {
    try {
      const { error } = await supabase
        .from('system_health')
        .insert({
          service_name,
          status,
          response_time_ms,
          error_message,
          metadata: {}
        });

      if (error) {
        console.error('System health tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track system health:', error);
    }
  };

  const trackCost = async (service_type: string, cost_amount: number, usage_units?: number, cost_per_unit?: number) => {
    try {
      const { error } = await supabase
        .from('cost_tracking')
        .insert({
          service_type,
          cost_amount,
          usage_units,
          cost_per_unit,
          user_id: user?.id || null
        });

      if (error) {
        console.error('Cost tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track cost:', error);
    }
  };

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackPerformance,
    trackSystemHealth,
    trackCost
  };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
