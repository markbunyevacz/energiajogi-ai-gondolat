import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { ResetPasswordRequest } from './pages/ResetPasswordRequest';
import { ResetPassword } from './pages/ResetPassword';
import { AuthPage } from '@/pages/AuthPage';
import { supabase } from '@/lib/supabase';

export function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password-request" element={<ResetPasswordRequest />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/legal"
            element={
              <ProtectedRoute requiredRole="legal_manager">
                <div>Legal Manager Dashboard</div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/analyst"
            element={
              <ProtectedRoute requiredRole="analyst">
                <div>Analyst Dashboard</div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/viewer"
            element={
              <ProtectedRoute requiredRole="viewer">
                <div>Viewer Dashboard</div>
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
