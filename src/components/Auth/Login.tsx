
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, Zap, FileText, Users } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Hibás email cím. Próbálja meg: jogasz@energiajog.hu, it@energiajog.hu, vagy tulajdonos@energiajog.hu');
    }
  };

  const quickLoginOptions = [
    { email: 'jogasz@energiajog.hu', role: 'Jogász', description: 'Jogi elemzések és dokumentumkeresés' },
    { email: 'it@energiajog.hu', role: 'IT Vezető', description: 'Rendszer metrikák és technikai áttekintés' },
    { email: 'tulajdonos@energiajog.hu', role: 'Tulajdonos', description: 'Üzleti mutatók és ROI elemzés' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mav-blue via-mav-blue-light to-mav-blue-dark flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Welcome Content */}
        <div className="text-white space-y-8 lg:pr-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">EJ</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold">Energiajogi AI Rendszer</h1>
            </div>
            
            <p className="text-xl text-white/90 leading-relaxed">
              Mesterséges intelligencia alapú megoldás energiajogi dokumentumok kezelésére, 
              elemzésére és jogi kérdések megválaszolására.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">Dokumentum Kezelés</h3>
              </div>
              <p className="text-white/80 text-sm">
                Feltöltés, keresés és elemzés energiajogi dokumentumokban
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">AI Jogi Asszisztens</h3>
              </div>
              <p className="text-white/80 text-sm">
                Claude AI alapú válaszok jogi kérdésekre
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">Szerződés Elemzés</h3>
              </div>
              <p className="text-white/80 text-sm">
                Automatikus kockázatelemzés és javaslatok
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">Multi-role Dashboard</h3>
              </div>
              <p className="text-white/80 text-sm">
                Szerepkör-specifikus nézetek és jogosultságok
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="space-y-6">
          <Card className="glass-effect">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl text-mav-blue">Bejelentkezés</CardTitle>
              <CardDescription>
                Válassza ki a szerepkörét a DEMO kipróbálásához
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pelda@energiajog.hu"
                    required
                    className="bg-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Jelszó</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Bármilyen jelszó működik"
                    required
                    className="bg-white/50"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-mav-blue hover:bg-mav-blue-dark"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Bejelentkezés...
                    </>
                  ) : (
                    'Bejelentkezés'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Login Options */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-lg text-mav-blue">Gyors Bejelentkezés</CardTitle>
              <CardDescription>
                Kattintson a szerepkörre a azonnali belépéshez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickLoginOptions.map((option) => (
                <Button
                  key={option.email}
                  variant="outline"
                  className="w-full justify-start text-left h-auto p-4 bg-white/50 hover:bg-white/70"
                  onClick={() => {
                    setEmail(option.email);
                    setPassword('demo');
                  }}
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="font-medium text-mav-blue">{option.role}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                    <div className="text-xs text-gray-500">{option.email}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
