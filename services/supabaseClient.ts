import { createClient } from '@supabase/supabase-js';

// In a real-world application, these values should come from environment variables.
// They are hardcoded here to resolve a runtime error in an environment without .env file support.
const supabaseUrl = 'https://pahyskuhfgequzsvafmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaHlza3VoZmdlcXV6c3ZhZm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODU4OTcsImV4cCI6MjA3MTg2MTg5N30.ZA9xm4JI1wXIbLsgm0Ve1vuFqyryhEE3f0HzTNvka4Q';

if (!supabaseUrl || !supabaseAnonKey) {
  // This check is kept as a safeguard but should not be triggered with hardcoded values.
  throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
