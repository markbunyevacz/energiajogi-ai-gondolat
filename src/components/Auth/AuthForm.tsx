import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthForm() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lovable.dev iframe betöltése
    const script = document.createElement('script');
    script.src = 'https://lovable.dev/embed/auth.js';
    script.async = true;
    script.onload = () => {
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <Card className="w-[350px] mx-auto mt-8">
      <CardHeader>
        <CardTitle>Bejelentkezés</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center">Betöltés...</div>
        ) : (
          <div 
            id="lovable-auth-container"
            data-project-id="43008c28-d425-4379-852f-8aa5277d7415"
            data-redirect-url={window.location.origin}
          />
        )}
      </CardContent>
    </Card>
  );
} 