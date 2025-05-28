
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from '@/hooks/useAuth';
import { Menu, User, LogOut, Settings, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { UserRole } from '@/types';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const roleLabels: Record<UserRole, string> = {
  jogász: 'Jogász',
  it_vezető: 'IT Vezető',
  tulajdonos: 'Tulajdonos'
};

const roleColors: Record<UserRole, string> = {
  jogász: 'bg-blue-100 text-blue-800',
  it_vezető: 'bg-green-100 text-green-800', 
  tulajdonos: 'bg-purple-100 text-purple-800'
};

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, logout, switchRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'documents', label: 'Dokumentumok', icon: FileText },
    { id: 'qa', label: 'Jogi Q&A', icon: MessageSquare },
    { id: 'analysis', label: 'Szerződéselemzés', icon: Settings }
  ];

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    onNavigate('dashboard');
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-mav-blue to-mav-blue-light rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EJ</span>
              </div>
              <h1 className="text-xl font-bold text-mav-blue">Energiajogi AI</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center space-x-2 ${
                      currentPage === item.id 
                        ? 'bg-mav-blue text-white' 
                        : 'text-gray-600 hover:text-mav-blue hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Badge className={roleColors[user.role]}>
              {roleLabels[user.role]}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-mav-blue text-white text-sm">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <div className="py-1">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Szerepkör váltás
                  </div>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleSwitch(role as UserRole)}
                      className={`flex items-center justify-between ${
                        user.role === role ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span>{label}</span>
                      {user.role === role && (
                        <div className="w-2 h-2 bg-mav-blue rounded-full"></div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Kijelentkezés
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-white">
                <nav className="flex flex-col space-y-2 mt-8">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant={currentPage === item.id ? "default" : "ghost"}
                        onClick={() => {
                          onNavigate(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center space-x-3 justify-start ${
                          currentPage === item.id 
                            ? 'bg-mav-blue text-white' 
                            : 'text-gray-600 hover:text-mav-blue hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Button>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
