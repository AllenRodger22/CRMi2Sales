import { createClient } from '@supabase/supabase-js';

// In a real-world application, these values should come from environment variables.
// They are hardcoded here to resolve a runtime error in an environment without .env file support.
const supabaseUrl = 'https://pahyskuhfgequzsvafmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaHlza3VoZmdlcXV6c3ZhZm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODU4OTcsImV4cCI6MjA3MTg2MTg5N30.ZA9xm4JI1wXIbLsgm0Ve1vuFqyryhEE3f0HzTNvka4Q';

/**
 * Supabase client configured for robust session handling.
 * - persistSession: Caches the session in localStorage.
 * - autoRefreshToken: Keeps the user logged in.
 * - flowType: 'pkce' is set for the Google OAuth flow; it does not affect email/password login.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  },
});
