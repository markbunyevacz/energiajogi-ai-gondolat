import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, Settings, Brain, Home, TestTube } from 'lucide-react';

export function Header() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-mav-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-semibold text-xl text-gray-900">
                Jogi AI Asszisztens
              </span>
            </Link>
            
            {user && (
              <nav className="hidden md:flex items-center space-x-4">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Home className="w-4 h-4" />
                    <span>Főoldal</span>
                  </Button>
                </Link>
                <Link to="/contract-analysis">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Brain className="w-4 h-4" />
                    <span>Szerződéselemzés</span>
                  </Button>
                </Link>
                {(profile?.role === 'it_vezető' || profile?.role === 'tulajdonos') && (
                  <Link to="/testing">
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <TestTube className="w-4 h-4" />
                      <span>Tesztelés</span>
                    </Button>
                  </Link>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.role === 'jogász' && 'Jogász'}
                        {profile?.role === 'it_vezető' && 'IT Vezető'}
                        {profile?.role === 'tulajdonos' && 'Tulajdonos'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Beállítások</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Kijelentkezés</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button>Bejelentkezés</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
