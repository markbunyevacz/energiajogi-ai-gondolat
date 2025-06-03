import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  const { user, signIn, signOut, hasRole } = useAuth();

  if (hasRole('admin')) {
    // Show admin features
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
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
