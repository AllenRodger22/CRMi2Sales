import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getAndEnsureUserProfile } from '../services/session';

export const useAuthBoot = () => {
  const navigate = useNavigate();
  const { setSession, setUser, setLoading, setIsPasswordRecovery, isPasswordRecovery, setError } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[auth]', event, !!session);

      // Sync Supabase token with localStorage for apiClient to use
      if (session?.access_token) {
        localStorage.setItem('authToken', session.access_token);
      } else {
        localStorage.removeItem('authToken');
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setSession(null);
        setUser(null);
        setLoading(false);
        navigate('/update-password', { replace: true });
        return;
      }
      
      if (isPasswordRecovery && event !== 'USER_UPDATED') {
          setIsPasswordRecovery(false);
      }

      if (event === 'INITIAL_SESSION') {
        setSession(session ?? null);
        if (session?.user) {
          try {
            const profile = await getAndEnsureUserProfile();
            setUser(profile);
          } catch(e) {
            console.warn('Failed to get profile on initial session', e);
            setUser(null);
            setError('Falha ao carregar o perfil do usuário.');
          }
        } else {
          setUser(null);
        }
        
        // Clean up URL from OAuth redirect
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
            setError(null); // Clear previous errors on successful sign in
            history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.search);
            navigate('/dashboard', { replace: true });
        } catch(e) {
            console.error('Sign in failed during profile fetch', e);
            setUser(null);
            setError('Falha ao carregar o perfil do usuário após o login.');
            navigate('/dashboard', { replace: true });
        } finally {
            setLoading(false);
        }
      }
      
      if (event === 'USER_UPDATED') {
        // This event fires after a password update, for example.
        // We can refetch the user profile if needed, but for now we just clear the recovery state.
        if (isPasswordRecovery) {
            setIsPasswordRecovery(false);
        }
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setLoading(false);
        setError(null);
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPasswordRecovery]);
};