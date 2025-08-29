import { createClient } from '@supabase/supabase-js';

// The Supabase URL and Key are hardcoded as per the project's current setup.
// In a production environment, these should be loaded from environment variables.
export const supabase = createClient(
  'https://ityisebfxsvwmaophyxsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWlzZWJmeHN2d21hb3BoeHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODU0OTIsImV4cCI6MjA3MTk2MTQ5Mn0.uP3FPdAVRTolGqdQtHtJeEMjR6fwqERg6xnWzj-BONQ',
  {
    auth: {
      // Using 'pkce' flow type is recommended for web apps for better security.
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      // This key ensures the auth state is synced between the app and the OAuth callback page.
      storageKey: 'sb-i2sales-auth',
    },
  }
);