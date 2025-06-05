import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { ResetPasswordRequest } from './pages/ResetPasswordRequest';
import { ResetPassword } from './pages/ResetPassword';
import { AuthPage } from '@/pages/AuthPage';
import { supabase } from '@/lib/supabase';
import { LovableFrontend } from './components/LovableFrontend';
import { Session } from '@supabase/supabase-js';

/**
 * Main App Component
 * 
 * This is the root component of the Legal AI Application that handles:
 * - Authentication state management
 * - Route configuration for different user roles
 * - Session management with Supabase
 * - Loading states during authentication checks
 * 
 * Features:
 * - Role-based access control (admin, legal_manager, analyst, viewer)
 * - Protected routes with authentication requirements
 * - Automatic session restoration on app load
 * - Redirect handling for unauthenticated users
 */
export function App() {
  // Authentication state - stores current user session
  const [session, setSession] = useState<Session | null>(null);
  
  // Loading state - prevents rendering routes until auth check is complete
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Authentication Effect
   * 
   * Handles:
   * 1. Initial session retrieval from Supabase
   * 2. Setting up auth state change listener
   * 3. Cleanup of subscription on component unmount
   */
  useEffect(() => {
    // Get current session on app initialization
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (login/logout/token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner while checking authentication status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          {/* These routes are accessible without authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password-request" element={<ResetPasswordRequest />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Role-Based Routes */}
          {/* Each route requires specific user roles for access */}
          
          {/* Admin Dashboard - Full system access and management */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
          
          {/* Legal Manager Interface - Legal document management and analysis */}
          <Route
            path="/legal"
            element={
              <ProtectedRoute requiredRole="legal_manager">
                <LovableFrontend />
              </ProtectedRoute>
            }
          />
          
          {/* Analyst Dashboard - Data analysis and reporting tools */}
          <Route
            path="/analyst"
            element={
              <ProtectedRoute requiredRole="analyst">
                <div>Analyst Dashboard</div>
              </ProtectedRoute>
            }
          />
          
          {/* Viewer Dashboard - Read-only access to documents and reports */}
          <Route
            path="/viewer"
            element={
              <ProtectedRoute requiredRole="viewer">
                <div>Viewer Dashboard</div>
              </ProtectedRoute>
            }
          />
          
          {/* Default Redirects */}
          {/* Redirect root path to login page */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch-all route - redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
