import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

/**
 * Supabase Configuration and Client Setup
 * 
 * This module handles:
 * - Supabase client initialization with type safety
 * - User role management and authentication
 * - Password reset and email verification functionality
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_KEY: Your Supabase anon public key
 */

// Load Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_KEY'
  );
}

/**
 * Supabase Client Instance
 * 
 * Configured with TypeScript database types for type safety
 * Used throughout the application for database operations and authentication
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * User Role Types
 * 
 * Defines the available user roles in the system:
 * - admin: Full system access and management capabilities
 * - legal_manager: Legal document management and analysis tools
 * - analyst: Data analysis and reporting functionality
 * - viewer: Read-only access to documents and reports
 */
export type UserRole = 'admin' | 'legal_manager' | 'analyst' | 'viewer';

/**
 * User Interface
 * 
 * Defines the structure of user data retrieved from Supabase
 */
export interface User {
  id: string;
  email?: string;
  role?: UserRole;
  email_confirmed_at?: string;
}

/**
 * Get User Role
 * 
 * Retrieves the role assigned to a specific user from the user_roles table
 * 
 * @param userId - The UUID of the user
 * @returns Promise<UserRole | null> - The user's role or null if not found/error
 * 
 * @example
 * ```typescript
 * const role = await getUserRole(user.id);
 * if (role === 'admin') {
 *   // Show admin interface
 * }
 * ```
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error.message, error.details);
      return null;
    }

    return data?.role || null;
  } catch (error) {
    console.error('Unexpected error fetching user role:', error);
    return null;
  }
};

/**
 * Reset Password Request
 * 
 * Sends a password reset email to the specified email address
 * The email will contain a link redirecting to the reset password page
 * 
 * @param email - The email address to send the reset link to
 * @throws Error if the reset request fails
 * 
 * @example
 * ```typescript
 * try {
 *   await resetPassword('user@example.com');
 *   // Show success message
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 */
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
};

/**
 * Update Password
 * 
 * Updates the current user's password
 * User must be authenticated to perform this action
 * 
 * @param newPassword - The new password (must meet security requirements)
 * @throws Error if the password update fails
 * 
 * @example
 * ```typescript
 * try {
 *   await updatePassword('newSecurePassword123!');
 *   // Password updated successfully
 * } catch (error) {
 *   // Handle error (weak password, user not authenticated, etc.)
 * }
 * ```
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    throw new Error(`Password update failed: ${error.message}`);
  }
};

/**
 * Send Email Verification
 * 
 * Sends a verification email with a one-time password (OTP) to the specified email
 * Used for email verification during registration or login
 * 
 * @param email - The email address to send the verification to
 * @throws Error if sending the verification email fails
 * 
 * @example
 * ```typescript
 * try {
 *   await sendEmailVerification('user@example.com');
 *   // Verification email sent
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 */
export const sendEmailVerification = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) {
    throw new Error(`Email verification failed: ${error.message}`);
  }
};

/**
 * Verify Email
 * 
 * Verifies an email address using the token received via email
 * 
 * @param token - The verification token from the email
 * @throws Error if email verification fails
 * 
 * @example
 * ```typescript
 * try {
 *   await verifyEmail(tokenFromEmail);
 *   // Email verified successfully
 * } catch (error) {
 *   // Handle verification error
 * }
 * ```
 */
export const verifyEmail = async (token: string): Promise<void> => {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email',
  });
  
  if (error) {
    throw new Error(`Email verification failed: ${error.message}`);
  }
}; 