
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, MessageSquare, Shield, Upload, Search, AlertTriangle, Activity } from 'lucide-react';
import { UserRole } from '@/types';

interface RecentActivityProps {
  role: UserRole;
}

interface ActivityItem {
  id: string;
  type: 'document' | 'question' | 'analysis' | 'upload' | 'search' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  status?: 'success' | 'warning' | 'error';
}

export function RecentActivity({ role }: RecentActivityProps) {
  const getActivitiesForRole = (): ActivityItem[] => {
    switch (role) {
      case 'jogász':
        return [
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
        ];

      case 'it_vezető':
        return [
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
        ];

      case 'tulajdonos':
        return [
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
        ];

      default:
        return [];
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'document': return FileText;
      case 'question': return MessageSquare;
      case 'analysis': return Shield;
      case 'upload': return Upload;
      case 'search': return Search;
      case 'alert': return AlertTriangle;
      default: return FileText;
    }
  };

  const getStatusColor = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activities = getActivitiesForRole();

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
          {activities.map((activity) => {
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
                          {activity.status === 'success' && 'Sikeres'}
                          {activity.status === 'warning' && 'Figyelem'}
                          {activity.status === 'error' && 'Hiba'}
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
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
