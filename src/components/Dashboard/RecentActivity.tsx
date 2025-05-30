import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, MessageSquare, Shield, Upload, Search, AlertTriangle, Activity } from 'lucide-react';
import { UserRole } from '@/types';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatTimestamp } from '@/components/QA/utils/qaHelpers';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { ActivityType, ActivityStatus, Database } from '@/types/supabase';

// Types
interface RecentActivityProps {
  role: UserRole;
}

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  status?: ActivityStatus;
}

type SupabaseActivity = Database['public']['Tables']['activities']['Row'];

// Constants
const ACTIVITY_LIMIT = 5;
const CHANNEL_NAME = 'activities';

// Utility functions
const getActivityIcon = (type: ActivityType) => {
  const iconMap: Record<ActivityType, typeof FileText> = {
    document: FileText,
    question: MessageSquare,
    analysis: Shield,
    upload: Upload,
    search: Search,
    alert: AlertTriangle
  };
  return iconMap[type] || FileText;
};

const getStatusColor = (status?: ActivityStatus): string => {
  const colorMap: Record<ActivityStatus, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };
  return status ? colorMap[status] : 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status?: ActivityStatus): string => {
  const labelMap: Record<ActivityStatus, string> = {
    success: 'Sikeres',
    warning: 'Figyelem',
    error: 'Hiba'
  };
  return status ? labelMap[status] : '';
};

const formatActivity = (activity: SupabaseActivity): ActivityItem => ({
  id: activity.id,
  type: activity.type,
  title: activity.title,
  description: activity.description,
  timestamp: formatTimestamp(activity.created_at),
  user: activity.user_name,
  status: activity.status
});

// Component
export function RecentActivity({ role }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: recentActivities, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_role', role)
        .order('created_at', { ascending: false })
        .limit(ACTIVITY_LIMIT);

      if (fetchError) throw fetchError;

      const formattedActivities = (recentActivities as SupabaseActivity[])
        .map(formatActivity);

      setActivities(formattedActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Nem sikerült betölteni a tevékenységeket');
      setActivities(getStaticActivitiesForRole(role));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchActivities();

    const subscription = supabase
      .channel(CHANNEL_NAME)
      .on<SupabaseActivity>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `user_role=eq.${role}`
        },
        (payload: RealtimePostgresChangesPayload<SupabaseActivity>) => {
          if (payload.new && isSupabaseActivity(payload.new)) {
            const newActivity = formatActivity(payload.new);
            setActivities(prev => [newActivity, ...prev].slice(0, ACTIVITY_LIMIT));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [role, fetchActivities]);

  const renderActivity = useCallback((activity: ActivityItem) => {
    const Icon = getActivityIcon(activity.type);
    
    return (
      <div
        key={activity.id}
        className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
      >
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-blue-600 text-white">
            <Icon className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </p>
            <div className="flex items-center space-x-2">
              {activity.status && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(activity.status)}`}
                >
                  {getStatusLabel(activity.status)}
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {activity.timestamp}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {activity.description}
          </p>
          {activity.user && (
            <p className="text-xs text-gray-500 mt-1">
              Felhasználó: {activity.user}
            </p>
          )}
        </div>
      </div>
    );
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Tevékenységek betöltése...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    if (activities.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">Nincsenek tevékenységek</p>
        </div>
      );
    }

    return activities.map(renderActivity);
  }, [loading, error, activities, renderActivity]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span>Legutóbbi Tevékenységek</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {content}
        </div>
      </CardContent>
    </Card>
  );
}

// Type guard for Supabase activity
function isSupabaseActivity(data: unknown): data is SupabaseActivity {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data &&
    'title' in data &&
    'description' in data &&
    'created_at' in data &&
    'user_role' in data
  );
}

// Static data fallback
function getStaticActivitiesForRole(role: UserRole): ActivityItem[] {
  const staticData: Record<UserRole, ActivityItem[]> = {
    jogász: [
      {
        id: '1',
        type: 'question',
        title: 'Új kérdés feltéve',
        description: 'Használja a Q&A szekciót energiajogi kérdések feltevéséhez',
        timestamp: '5 perce',
        status: 'success'
      },
      {
        id: '2',
        type: 'document',
        title: 'Dokumentumtár elérhető',
        description: 'Töltse fel energiajogi dokumentumokat elemzéshez',
        timestamp: '1 órája',
        status: 'success'
      }
    ],
    it_vezető: [
      {
        id: '1',
        type: 'alert',
        title: 'Rendszer állapot',
        description: 'Minden rendszer normálisan működik',
        timestamp: '10 perce',
        status: 'success'
      },
      {
        id: '2',
        type: 'upload',
        title: 'Adatbázis elérhető',
        description: 'Supabase kapcsolat aktív',
        timestamp: '1 órája',
        status: 'success'
      }
    ],
    tulajdonos: [
      {
        id: '1',
        type: 'analysis',
        title: 'Rendszer telepítve',
        description: 'Az energiajogi AI rendszer sikeresen beüzemelt',
        timestamp: '1 órája',
        status: 'success'
      },
      {
        id: '2',
        type: 'document',
        title: 'Adatbázis inicializálva',
        description: 'Minden szükséges tábla létrehozva',
        timestamp: '2 órája',
        status: 'success'
      }
    ]
  };

  return staticData[role] || [];
}
