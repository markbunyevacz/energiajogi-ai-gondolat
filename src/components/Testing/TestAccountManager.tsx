import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Key, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface TestAccount {
  id: string;
  email: string;
  role: string;
}

interface TestAccountManagerProps {
  onAccountCreate: (account: Omit<TestAccount, 'id'>) => void;
  onAccountDelete: (id: string) => void;
}

export function TestAccountManager({ onAccountCreate, onAccountDelete }: TestAccountManagerProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('jogász');

  const handleCreateAccount = () => {
    if (!email.trim()) {
      toast.error('Kérjük adjon meg egy email címet');
      return;
    }

    onAccountCreate({
      email,
      role
    });

    setEmail('');
    toast.success('Teszt fiók sikeresen létrehozva');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teszt Fiókok Kezelése</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email cím</Label>
          <div className="flex space-x-2">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teszt@pelda.hu"
            />
            <Button onClick={handleCreateAccount}>
              <Plus className="w-4 h-4 mr-2" />
              Létrehozás
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
