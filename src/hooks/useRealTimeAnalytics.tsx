
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface RealTimeAnalytics {
  api_performance: {
    avg_response_time: number;
    total_requests: number;
    error_rate: number;
  };
  user_activity: {
    active_users: number;
    total_events: number;
    top_events: Array<{ event_type: string; count: number }>;
  };
  system_health: Array<{
    service: string;
    status: string;
    avg_response_time: number;
  }>;
  costs: {
    total_cost: number;
    by_service: Array<{ service: string; cost: number }>;
  };
}

export function useRealTimeAnalytics(timeRangeHours: number = 24) {
  const [realTimeData, setRealTimeData] = useState<RealTimeAnalytics | null>(null);

  // Fetch initial data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['real-time-analytics', timeRangeHours],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_real_time_analytics', {
        time_range_hours: timeRangeHours
      });
      
      if (error) throw error;
      return data as unknown as RealTimeAnalytics;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const channels = [
      supabase
        .channel('performance-metrics-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'performance_metrics'
          },
          () => {
            refetch();
          }
        ),
      
      supabase
        .channel('analytics-events-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'analytics_events'
          },
          () => {
            refetch();
          }
        ),
      
      supabase
        .channel('system-health-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'system_health'
          },
          () => {
            refetch();
          }
        ),
      
      supabase
        .channel('cost-tracking-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'cost_tracking'
          },
          () => {
            refetch();
          }
        )
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [refetch]);

  useEffect(() => {
    if (data) {
      setRealTimeData(data);
    }
  }, [data]);

  return {
    data: realTimeData,
    isLoading,
    error,
    refetch
  };
}
