
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Header } from "@/components/Layout/Header";
import { TestingDashboard } from '@/components/Testing/TestingDashboard';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Testing() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only IT vezetők and tulajdonosok can access testing
    if (profile && profile.role !== 'it_vezető' && profile.role !== 'tulajdonos') {
      toast.error('Nincs jogosultsága a tesztelési felülethez');
      navigate('/');
    }
  }, [profile, navigate]);

  // Don't render anything if user doesn't have permission
  if (profile && profile.role !== 'it_vezető' && profile.role !== 'tulajdonos') {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <TestingDashboard />
        </main>
      </div>
    </ProtectedRoute>
  );
}
