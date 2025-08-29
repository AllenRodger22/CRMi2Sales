import { supabase } from '../services/supabaseClient';
// FIX: Use `import type` for Supabase types to fix module resolution errors.
import type { User as AuthUser } from '@supabase/supabase-js';

/**
 * Ensures a profile exists in the public.users table for the authenticated user.
 * This is a non-blocking operation; if it fails, it logs a warning but does
 * not interrupt the user's login flow.
 * @param user The user object from Supabase Auth.
 */
export async function ensureProfile(user: AuthUser) {
  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      email: user.email,
      role: 'BROKER',
    }, { onConflict: 'id' });

  if (error) {
    console.warn('ensureProfile error:', error);
  }
}