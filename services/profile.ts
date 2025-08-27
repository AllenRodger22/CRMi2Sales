import { supabase } from './supabaseClient';
import { User, Role } from '../types';
import { convertObjectKeys, snakeToCamel } from '../utils/helpers';

/**
 * Fetches a user's profile from the 'profiles' table.
 * Returns null if the profile does not exist.
 * @param userId The UUID of the user.
 */
export async function getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    
    if (error) {
        console.error("Error fetching profile:", error);
        throw error;
    }
    
    if (!data) return null;

    // Supabase returns snake_case, convert to camelCase for the app
    return convertObjectKeys(data, snakeToCamel) as User;
}

/**
 * Creates a new user profile. This should only be called once on first login.
 * @param profile The profile data to insert.
 */
export async function createProfile(profile: { id: string; email: string; name: string; role: Role }): Promise<User> {
    const { data, error } = await supabase
        .from('profiles')
        .insert([
            {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
            },
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating profile:", error);
        throw error;
    }

    return convertObjectKeys(data, snakeToCamel) as User;
}
