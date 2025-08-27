import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { getAndEnsureUserProfile } from '../services/session';
// FIX: Corrected the import path for the useAuth hook.
import { useAuth } from '../hooks/useAuth';

const clearAuthHashFragment = () => {
    if (window.location.hash.includes('access_token')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
};

export const useAuthBoot = () => {
    const nav = useNavigate();
    const { setUser, setLoading, setIsPasswordRecovery } = useAuth();

    useEffect(() => {
        setLoading(true);
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                try {
                    const profile = await getAndEnsureUserProfile();
                    setUser(profile);
                } catch (e) {
                    console.error("Failed to get profile on boot", e);
                    setUser(null);
                    await supabase.auth.signOut();
                }
            } else {
                setUser(null);
            }
            clearAuthHashFragment();
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
                setUser(null);
                return;
            }
            
            setIsPasswordRecovery(false); // Reset on any other event
            
            if (event === 'SIGNED_IN' && session) {
                try {
                    const profile = await getAndEnsureUserProfile();
                    setUser(profile);
                    clearAuthHashFragment();
                    nav('/dashboard', { replace: true });
                } catch (e) {
                    console.error("Failed to get profile on sign-in", e);
                    setUser(null);
                    await supabase.auth.signOut();
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                nav('/login', { replace: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [nav, setUser, setLoading, setIsPasswordRecovery]);
};