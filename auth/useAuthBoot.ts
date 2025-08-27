import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getAndEnsureUserProfile } from '../services/session';

export const useAuthBoot = () => {
  const navigate = useNavigate();
  const { setSession, setUser, setLoading, setIsPasswordRecovery, isPasswordRecovery } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[auth]', event, !!session);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setSession(null);
        setUser(null);
        setLoading(false); // Unlock to show the update password page
        return;
      }
      
      // Reset on other events, ensuring the main app UI is shown
      if (isPasswordRecovery) setIsPasswordRecovery(false);

      if (event === 'INITIAL_SESSION') {
        setSession(session ?? null);
        if (session?.user) {
          try {
            const profile = await getAndEnsureUserProfile();
            setUser(profile);
          } catch(e) {
            console.warn('Failed to get profile on initial session', e);
            setUser(null);
            // DO NOT clear session. Session is valid, only profile fetch failed.
            // The UI will handle the 'user === null' state gracefully.
          }
        } else {
          setUser(null);
        }
        
        if (window.location.hash.includes('access_token=')) {
          history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.search);
        }

        setLoading(false);
      }

      if (event === 'SIGNED_IN' && session?.user) {
        setSession(session);
        try {
            const profile = await getAndEnsureUserProfile();
            setUser(profile);
            // The 'getAndEnsureUserProfile' RPC call is now the single source of truth
            // for creating and retrieving the user profile, making a frontend
            // upsert redundant and potentially inconsistent.
            
            history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.search);
            navigate('/dashboard', { replace: true });
        } catch(e) {
            console.error('Sign in failed during profile fetch', e);
            // DO NOT SIGN OUT. The session is valid, only profile fetch failed.
            // The user will be redirected to the dashboard, which will show an error state.
            setUser(null);
            navigate('/dashboard', { replace: true });
        }
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setLoading(false);
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};