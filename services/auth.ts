
// services/auth.ts
import { supabase } from './supabaseClient';
import { Role } from '../types';

/**
 * Logs in a user using email and password.
 */
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Signs in the user using Google OAuth with a redirect flow.
 * An explicit redirectTo is provided for HashRouter compatibility.
 */
export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/#/`,
      queryParams: { prompt: 'select_account' }
    }
  });
  if (error) throw error;
}

/**
 * Registers a new user in Supabase Auth.
 * The user's profile in the `profiles` table will be created automatically
 * by the `ensure_profile` RPC function upon the first login, which happens
 * immediately after sign-up if email confirmation is disabled.
 */
export async function register(
    { name, email, password, role }: { name: string; email: string; password: string; role: Role }
) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // Pass user metadata to be used by the `ensure_profile` RPC function
            data: {
                name,
                role,
            }
        }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Registration failed: No user object returned.");

    // If `data.session` is null, it means email confirmation is required.
    const confirmationSent = data.session === null;

    return { user: data.user, confirmationSent };
}

/**
 * Sends a password reset email to the user.
 * The redirect URL is now managed solely by the 'Site URL' setting in the Supabase dashboard.
 */
export async function sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
}

/**
 * Updates the current user's password. This is used after a password recovery flow.
 */
export async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
}

/**
 * Logs out the current user.
 */
export const logout = () => supabase.auth.signOut();
