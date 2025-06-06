/**
 * ProtectedRoute Component - Role-Based Access Control
 * 
 * This component implements comprehensive role-based access control (RBAC) for the Legal AI application.
 * It ensures that users can only access routes and components that match their assigned role,
 * providing security and proper user experience based on permissions.
 * 
 * SECURITY FEATURES:
 * - Authentication verification (user must be logged in)
 * - Role-based authorization (user must have required role)
 * - Automatic redirection for unauthorized access with state preservation
 * - Loading state handling during authentication checks
 * - Error state handling for authentication failures
 * 
 * SUPPORTED ROLES:
 * - admin: Full system access and management capabilities
 * - legal_manager: Legal document management and analysis tools
 * - analyst: Data analysis and reporting functionality
 * - viewer: Read-only access to documents and reports
 * 
 * USAGE PATTERNS:
 * - Wrap route components that require authentication
 * - Specify required role for role-specific access
 * - Handles loading states during auth verification
 * - Preserves intended destination for post-login redirect
 * - Provides user-friendly error messages for access issues
 * 
 * INTEGRATION POINTS:
 * - AuthContext for user authentication state
 * - React Router for navigation and redirects with state
 * - Supabase user roles from database
 * - LoadingSpinner and ErrorMessage components for UX
 * 
 * @fileoverview Role-based route protection component with comprehensive error handling
 * @author Legal AI Team / Lovable
 * @since 1.0.0
 * @version 1.0.0
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import type { UserRole } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

/**
 * ProtectedRoute Props Interface
 * 
 * Defines the properties for the ProtectedRoute component with comprehensive type safety
 */
interface ProtectedRouteProps {
  /** Child components to render if access is granted */
  children: React.ReactNode;
  
  /** 
   * Optional role requirement - if specified, user must have this exact role
   * If not provided, only authentication is required (any authenticated user can access)
   */
  requiredRole?: UserRole;
}

/**
 * ProtectedRoute Component Implementation
 * 
 * Implements comprehensive role-based access control with multiple security checks
 * and user-friendly error handling. Provides loading states and preserves navigation state.
 * 
 * @param children - Components to render if access is granted
 * @param requiredRole - Optional role requirement for access
 * @returns JSX element with protected content, loading state, error state, or redirect
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // ============================================================================
  // HOOKS AND STATE MANAGEMENT
  // ============================================================================
  
  /** Get authentication state from AuthContext */
  const { user, loading, error } = useAuth();
  
  /** Get current location for post-login redirect preservation */
  const location = useLocation();

  // ============================================================================
  // LOADING STATE HANDLING
  // ============================================================================
  
  /**
   * Show loading spinner while authentication state is being determined
   * This prevents flickering between login redirect and protected content
   * Uses the reusable LoadingSpinner component for consistent UX
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE HANDLING
  // ============================================================================
  
  /**
   * Handle authentication errors (network issues, invalid tokens, etc.)
   * Provides user-friendly error message with retry functionality
   * Uses the reusable ErrorMessage component for consistent error UX
   */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage
          message="Failed to load user data. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================
  
  /**
   * Redirect to login if user is not authenticated
   * Preserves the intended destination in navigation state for post-login redirect
   * The 'replace' prop prevents adding the protected route to browser history
   */
  if (!user) {
    // Save the attempted URL for redirect after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ============================================================================
  // AUTHORIZATION CHECKS
  // ============================================================================
  
  /**
   * Check if user has a role assigned when a specific role is required
   * This handles cases where user is authenticated but has no role assigned
   * Provides clear error message about missing permissions
   */
  if (requiredRole && !user.role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage
          message="You don't have the required permissions to access this page."
        />
      </div>
    );
  }

  /**
   * Check role-based authorization if a specific role is required
   * Ensures user has the exact role needed for the protected resource
   * Provides specific error message indicating required role
   * 
   * TODO: Consider implementing role hierarchy (e.g., admin can access all roles)
   * TODO: Add security logging for unauthorized access attempts
   */
  if (requiredRole && user.role !== requiredRole) {
    // TODO: Log unauthorized access attempt for security monitoring
    // securityLogger.logUnauthorizedAccess({
    //   userId: user.id,
    //   userRole: user.role,
    //   requiredRole,
    //   timestamp: new Date().toISOString(),
    //   route: location.pathname,
    //   userAgent: navigator.userAgent
    // });
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage
          message={`You need ${requiredRole} role to access this page.`}
        />
      </div>
    );
  }

  // ============================================================================
  // RENDER PROTECTED CONTENT
  // ============================================================================
  
  /**
   * User is authenticated and authorized - render the protected content
   * The fragment wrapper ensures clean rendering without extra DOM elements
   * 
   * TODO: Consider adding analytics tracking for successful access
   * TODO: Add performance monitoring for protected route rendering
   */
  return <>{children}</>;
} 