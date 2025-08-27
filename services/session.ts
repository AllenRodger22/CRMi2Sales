// services/session.ts
import { supabase } from './supabaseClient';
import { User } from '../types';

/**
 * Calls an RPC function to get the current user's profile from the `profiles` table.
 * If the profile doesn't exist, the RPC function creates it automatically using metadata
 * from the JWT (e.g., name from Google, or name/role provided at sign-up).
 * This is the single source of truth for fetching a user's profile data after authentication.
 */
export async function getAndEnsureUserProfile(): Promise<User> {
    // The `ensure_profile` function takes no arguments as it reads user data
    // from the JWT session on the backend.
    const { data, error } = await supabase.rpc('ensure_profile');

    if (error) {
        console.error('Error ensuring user profile:', error);
        // Propagate the error instead of signing out. The caller (AuthContext)
        // will handle this by setting the user state to null, which is a safer
        // way to manage a failed profile fetch without causing extra auth events.
        throw error;
    }
    
    if (!data) {
        // This should not happen if the RPC function is correct, but it's a safeguard.
        throw new Error("User profile could not be retrieved from the database.");
    }
    
    // The RPC function returns a single JSON object.
    return data as User;
}
