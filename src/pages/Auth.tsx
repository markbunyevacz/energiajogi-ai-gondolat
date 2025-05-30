
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from '@/components/Auth/Login';
import { useAuth } from '@/hooks/useAuth';

export default function Auth() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-mav-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  return <Login />;
}
