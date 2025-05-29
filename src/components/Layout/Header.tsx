import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function Header() {
  const { profile, logout } = useAuth();
  const [notifications] = useState([
    { id: 1, title: 'Új dokumentum elemzés', message: 'Energiaszerződés elemzés befejezve', unread: true },
    { id: 2, title: 'Rendszer frissítés', message: 'Új funkciók érhetők el', unread: false }
  ]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sikeresen kijelentkezett');
    } catch (error) {
      toast.error('Hiba a kijelentkezés során');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'jogász': return 'Jogász';
      case 'it_vezető': return 'IT Vezető';
      case 'tulajdonos': return 'Tulajdonos';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'jogász': return 'bg-blue-100 text-blue-800';
      case 'it_vezető': return 'bg-green-100 text-green-800';
      case 'tulajdonos': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-mav-blue" />
              <span className="text-xl font-bold text-gray-900">LegalAI</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-mav-blue transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to="/contract-analysis" 
                className="text-gray-700 hover:text-mav-blue transition-colors"
              >
                Szerződéselemzés
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Értesítések</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm">{notification.title}</span>
                      {notification.unread && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{notification.message}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-mav-blue text-white">
                      {profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{profile?.name || 'Felhasználó'}</span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getRoleColor(profile?.role || 'jogász')}`}
                    >
                      {getRoleLabel(profile?.role || 'jogász')}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Fiók kezelése</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Beállítások</span>
                </DropdownMenuItem>
                {(profile?.role === 'it_vezető' || profile?.role === 'tulajdonos') && (
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Adminisztráció</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Kijelentkezés</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
