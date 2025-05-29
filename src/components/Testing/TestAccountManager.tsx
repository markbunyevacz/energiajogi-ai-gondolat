
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Shield, Key, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'jogász' | 'it_vezető' | 'tulajdonos';
  status: 'active' | 'inactive';
  password?: string;
  createdAt: Date;
}

export function TestAccountManager() {
  const [testUsers, setTestUsers] = useState<TestUser[]>([
    {
      id: '1',
      email: 'jogasz.teszt@example.com',
      name: 'Dr. Teszt Jogász',
      role: 'jogász',
      status: 'active',
      password: 'TestPass123!',
      createdAt: new Date()
    },
    {
      id: '2', 
      email: 'it.vezeto@example.com',
      name: 'Teszt IT Vezető',
      role: 'it_vezető',
      status: 'active',
      password: 'TestPass123!',
      createdAt: new Date()
    },
    {
      id: '3',
      email: 'tulajdonos@example.com', 
      name: 'Teszt Tulajdonos',
      role: 'tulajdonos',
      status: 'active',
      password: 'TestPass123!',
      createdAt: new Date()
    }
  ]);

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'jogász' as const,
    password: 'TestPass123!'
  });

  const [isCreating, setIsCreating] = useState(false);

  const createTestUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast.error('Email és név megadása kötelező');
      return;
    }

    setIsCreating(true);
    
    try {
      // In a real implementation, this would create actual users
      // For testing purposes, we're using mock data
      const testUser: TestUser = {
        id: Math.random().toString(36).substr(2, 9),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: 'active',
        password: newUser.password,
        createdAt: new Date()
      };

      setTestUsers(prev => [...prev, testUser]);
      
      setNewUser({
        email: '',
        name: '',
        role: 'jogász',
        password: 'TestPass123!'
      });

      toast.success(`Teszt felhasználó létrehozva: ${testUser.email}`);
    } catch (error) {
      console.error('Error creating test user:', error);
      toast.error('Hiba a teszt felhasználó létrehozásakor');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTestUser = async (userId: string) => {
    try {
      setTestUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('Teszt felhasználó törölve');
    } catch (error) {
      console.error('Error deleting test user:', error);
      toast.error('Hiba a teszt felhasználó törlésekor');
    }
  };

  const generateTestData = async () => {
    toast.info('Teszt adatok generálása...');
    
    try {
      // Simulate test data generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Teszt adatok sikeresen generálva');
    } catch (error) {
      toast.error('Hiba a teszt adatok generálásakor');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teszt Fiókok Kezelése</h2>
          <p className="text-gray-600">Teszteléshez használt felhasználói fiókok</p>
        </div>
        
        <Button onClick={generateTestData}>
          <Plus className="w-4 h-4 mr-2" />
          Teszt Adatok Generálása
        </Button>
      </div>

      {/* Create New Test User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Új Teszt Felhasználó
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="teszt@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="name">Név</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Teszt Felhasználó"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Szerepkör</Label>
              <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jogász">Jogász</SelectItem>
                  <SelectItem value="it_vezető">IT Vezető</SelectItem>
                  <SelectItem value="tulajdonos">Tulajdonos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={createTestUser} 
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Létrehozás...' : 'Létrehozás'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Meglévő Teszt Felhasználók ({testUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                  
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    {user.password}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTestUser(user.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Teszt Dokumentumok</p>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-gray-500">Szerződések, rendeletek, ítéletek</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                📄
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">QA Adatok</p>
                <p className="text-2xl font-bold">25</p>
                <p className="text-xs text-gray-500">Kérdés-válasz párok minden ágenshez</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                ❓
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Analytics Események</p>
                <p className="text-2xl font-bold">150</p>
                <p className="text-xs text-gray-500">Felhasználói interakció adatok</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                📊
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
