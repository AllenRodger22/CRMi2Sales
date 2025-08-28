import { createClient } from '@supabase/supabase-js';

// In a real-world application, these values should come from environment variables.
// They are updated here with the user's provided credentials to ensure correct connectivity.
const supabaseUrl = 'https://ityisebfxsvwmaophyxsn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWlzZWJmeHN2d21hb3BoeHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODU0OTIsImV4cCI6MjA3MTk2MTQ5Mn0.uP3FPdAVRTolGqdQtHtJeEMjR6fwqERg6xnWzj-BONQ';

/**
 * Supabase client configured for robust session handling.
 * - persistSession: Caches the session in localStorage.
 * - autoRefreshToken: Keeps the user logged in.
 * - flowType: 'pkce' is set for the Google OAuth flow; it does not affect email/password login.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    // ⚠️ Força a MESMA chave de armazenamento em app e callback
    storageKey: 'sb-i2sales-auth',
  },
});