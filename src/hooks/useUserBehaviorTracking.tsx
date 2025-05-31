import { useEffect, useRef } from 'react';
import { useAnalyticsTracking } from './useAnalyticsTracking';
import { useAuth } from './useAuth';

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: string[];
  interactions: Array<{
    type: string;
    target: string;
    timestamp: number;
  }>;
}

export function useUserBehaviorTracking() {
  const { trackEvent, trackUserAction } = useAnalyticsTracking();
  const { } = useAuth();
  const sessionRef = useRef<UserSession | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize session
    if (!sessionRef.current) {
      sessionRef.current = {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        lastActivity: Date.now(),
        pageViews: [],
        interactions: []
      };

      trackEvent({
        event_type: 'session_start',
        event_data: {
          sessionId: sessionRef.current.sessionId,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      });
    }

    // Track user interactions
    const trackInteraction = (event: Event) => {
      if (sessionRef.current) {
        sessionRef.current.lastActivity = Date.now();
        
        const interaction = {
          type: event.type,
          target: (event.target as Element)?.tagName || 'unknown',
          timestamp: Date.now()
        };

        sessionRef.current.interactions.push(interaction);

        trackUserAction('user_interaction', {
          sessionId: sessionRef.current.sessionId,
          interaction
        });

        // Reset inactivity timer
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
          trackUserAction('user_inactive', {
            sessionId: sessionRef.current?.sessionId,
            inactiveDuration: 300000 // 5 minutes
          });
        }, 300000);
      }
    };

    // Track scroll behavior
    const trackScroll = () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      trackUserAction('scroll_depth', {
        sessionId: sessionRef.current?.sessionId,
        scrollPercentage,
        page: window.location.pathname
      });
    };

    // Add event listeners
    ['click', 'keydown', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });

    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScroll, 1000);
    };
    window.addEventListener('scroll', throttledScroll, { passive: true });

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackUserAction('page_hidden', {
          sessionId: sessionRef.current?.sessionId,
          duration: Date.now() - (sessionRef.current?.lastActivity || 0)
        });
      } else {
        trackUserAction('page_visible', {
          sessionId: sessionRef.current?.sessionId
        });
        if (sessionRef.current) {
          sessionRef.current.lastActivity = Date.now();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      ['click', 'keydown', 'mousemove'].forEach(eventType => {
        document.removeEventListener(eventType, trackInteraction);
      });
      window.removeEventListener('scroll', throttledScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [trackEvent, trackUserAction]);

  const trackFeatureUsage = (featureName: string, metadata?: Record<string, any>) => {
    trackUserAction('feature_usage', {
      sessionId: sessionRef.current?.sessionId,
      feature: featureName,
      timestamp: Date.now(),
      ...metadata
    });
  };

  const trackConversionEvent = (eventName: string, value?: number) => {
    trackEvent({
      event_type: 'conversion',
      event_data: {
        sessionId: sessionRef.current?.sessionId,
        event: eventName,
        value,
        timestamp: Date.now()
      }
    });
  };

  const endSession = () => {
    if (sessionRef.current) {
      trackEvent({
        event_type: 'session_end',
        event_data: {
          sessionId: sessionRef.current.sessionId,
          duration: Date.now() - sessionRef.current.startTime,
          pageViews: sessionRef.current.pageViews.length,
          interactions: sessionRef.current.interactions.length
        }
      });
      sessionRef.current = null;
    }
  };

  return {
    trackFeatureUsage,
    trackConversionEvent,
    endSession,
    sessionId: sessionRef.current?.sessionId
  };
}
