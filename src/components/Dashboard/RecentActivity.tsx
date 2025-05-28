
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, MessageSquare, Shield, Upload, Search, AlertTriangle, Activity } from 'lucide-react';
import { UserRole } from '@/types';

interface ActivityItem {
  id: string;
  type: 'document' | 'question' | 'analysis' | 'upload' | 'search' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  status?: 'success' | 'warning' | 'error';
}

interface RecentActivityProps {
  role: UserRole;
}

export function RecentActivity({ role }: RecentActivityProps) {
  const getActivitiesForRole = (): ActivityItem[] => {
    switch (role) {
      case 'jogász':
        return [
          {
            id: '1',
            type: 'question',
            title: 'Jogi kérdés: Energiaszerződés felmondása',
            description: 'Mi a határidő lakossági energiaszerződés felmondására?',
            timestamp: '5 perce',
            status: 'success'
          },
          {
            id: '2',
            type: 'analysis',
            title: 'Szerződéselemzés befejezve',
            description: 'MVM Áramszolgáltatási szerződés - 3 kockázat azonosítva',
            timestamp: '12 perce',
            status: 'warning'
          },
          {
            id: '3',
            type: 'search',
            title: 'Dokumentumkeresés',
            description: 'Keresés: "force majeure energiaszerződés"',
            timestamp: '25 perce',
            status: 'success'
          },
          {
            id: '4',
            type: 'document',
            title: 'Új dokumentum indexelve',
            description: 'MEKH Rendelet 2024/15 - Energiahatékonysági követelmények',
            timestamp: '1 órája',
            status: 'success'
          },
          {
            id: '5',
            type: 'question',
            title: 'Jogi kérdés: Csatlakozási díjak',
            description: 'Milyen díjakat számíthat fel a hálózatüzemeltető?',
            timestamp: '2 órája',
            status: 'success'
          }
        ];

      case 'it_vezető':
        return [
          {
            id: '1',
            type: 'alert',
            title: 'API használat figyelmeztetés',
            description: 'Claude API használat elérte a 85%-ot',
            timestamp: '10 perce',
            status: 'warning'
          },
          {
            id: '2',
            type: 'upload',
            title: 'Dokumentum feldolgozás',
            description: '15 új dokumentum sikeresen indexelve',
            timestamp: '1 órája',
            status: 'success'
          },
          {
            id: '3',
            type: 'alert',
            title: 'Rendszer teljesítmény',
            description: 'Válaszidő optimalizálás befejezve - 15% javulás',
            timestamp: '3 órája',
            status: 'success'
          },
          {
            id: '4',
            type: 'document',
            title: 'Vektoradatbázis frissítés',
            description: 'FAISS index újragenerálva - 1,250 dokumentum',
            timestamp: '5 órája',
            status: 'success'
          },
          {
            id: '5',
            type: 'alert',
            title: 'Biztonsági mentés',
            description: 'Napi biztonsági mentés sikeresen befejezve',
            timestamp: '8 órája',
            status: 'success'
          }
        ];

      case 'tulajdonos':
        return [
          {
            id: '1',
            type: 'analysis',
            title: 'Havi jelentés generálva',
            description: '450k Ft költségmegtakarítás ez hónapban',
            timestamp: '1 órája',
            status: 'success'
          },
          {
            id: '2',
            type: 'document',
            title: 'ROI elemzés frissült',
            description: 'Befektetés megtérülés: 340% (előző hónap: 295%)',
            timestamp: '1 napja',
            status: 'success'
          },
          {
            id: '3',
            type: 'alert',
            title: 'Új ügyfél regisztráció',
            description: 'E.ON Energiakereskedő csatlakozott a rendszerhez',
            timestamp: '2 napja',
            status: 'success'
          },
          {
            id: '4',
            type: 'analysis',
            title: 'Kockázatcsökkentés jelentés',
            description: '65% kockázatcsökkentés az automatizált elemzésekkel',
            timestamp: '3 napja',
            status: 'success'
          },
          {
            id: '5',
            type: 'document',
            title: 'Compliance audit',
            description: 'GDPR megfelelőségi audit sikeresen teljesítve',
            timestamp: '1 hete',
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
          <Activity className="w-5 h-5 text-mav-blue" />
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
                  <AvatarFallback className="bg-mav-blue text-white">
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
