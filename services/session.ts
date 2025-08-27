// services/session.ts
import { supabase } from './supabaseClient';
import { User } from '../types';

/**
 * Calls an RPC function to get the current user's profile from the `profiles` table.
 * If the profile doesn't exist, the RPC function creates it automatically using metadata
 * from the JWT (e.g., name from Google, or name/role provided at sign-up).
 * This is the single source of truth for fetching a user's profile data after authentication.
 */
export async function getAndEnsureUserProfile(): Promise<User | null> {
    // The `ensure_profile` function takes no arguments as it reads user data
    // from the JWT session on the backend.
    const { data, error } = await supabase.rpc('ensure_profile');

    if (error) {
        console.error('Error ensuring user profile:', error);
        // Log out the user if their profile can't be fetched or created,
        // as this indicates a severe state inconsistency.
        await supabase.auth.signOut();
        return null;
    }
    
    // The RPC function returns a single JSON object.
    return data as User;
}
