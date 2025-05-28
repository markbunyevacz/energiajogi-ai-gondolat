
import { useEffect } from 'react';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

export function PerformanceMonitor({ children }: PerformanceMonitorProps) {
  const { trackPerformance, trackSystemHealth } = useAnalyticsTracking();

  useEffect(() => {
    // Track page load performance
    const trackPageLoad = () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        trackPerformance('page_load_time', loadTime, {
          page: window.location.pathname
        });
      }
    };

    // Track API performance
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Track API response time
        if (url.includes('/api/') || url.includes('supabase')) {
          trackPerformance('api_response_time', responseTime, {
            url,
            status: response.status,
            method: args[1]?.method || 'GET'
          });
          
          // Track system health based on response
          const status = response.ok ? 'healthy' : 'error';
          trackSystemHealth(
            'api',
            status,
            responseTime,
            response.ok ? undefined : `HTTP ${response.status}`
          );
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        trackPerformance('api_error', responseTime, {
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        trackSystemHealth('api', 'error', responseTime, 
          error instanceof Error ? error.message : 'Network error'
        );
        
        throw error;
      }
    };

    // Track page load when component mounts
    if (document.readyState === 'complete') {
      trackPageLoad();
    } else {
      window.addEventListener('load', trackPageLoad);
    }

    // Track system health periodically
    const healthCheckInterval = setInterval(() => {
      // Basic health check - measure memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        trackPerformance('memory_usage', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
      }
      
      // Track connection status
      trackSystemHealth(
        'network',
        navigator.onLine ? 'healthy' : 'error',
        undefined,
        navigator.onLine ? undefined : 'Offline'
      );
    }, 60000); // Every minute

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('load', trackPageLoad);
      clearInterval(healthCheckInterval);
    };
  }, [trackPerformance, trackSystemHealth]);

  return <>{children}</>;
}
