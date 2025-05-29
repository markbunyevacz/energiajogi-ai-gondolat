
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Header } from "@/components/Layout/Header";
import { TestingDashboard } from '@/components/Testing/TestingDashboard';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Testing() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);

  useEffect(() => {
    // Only check permissions after profile is loaded and we haven't checked yet
    if (!isLoading && profile && !hasCheckedPermissions) {
      console.log('Checking permissions for user:', profile);
      console.log('User role:', profile.role);
      
      if (profile.role !== 'it_vezető' && profile.role !== 'tulajdonos') {
        console.log('Access denied for role:', profile.role);
        toast.error('Nincs jogosultsága a tesztelési felülethez');
        navigate('/');
      } else {
        console.log('Access granted for role:', profile.role);
        toast.success('🧪 Tesztelési felület betöltése...');
      }
      setHasCheckedPermissions(true);
    }
  }, [profile, isLoading, navigate, hasCheckedPermissions]);

  // Show loading while checking permissions
  if (isLoading || !hasCheckedPermissions) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-mav-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Jogosultságok ellenőrzése...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
