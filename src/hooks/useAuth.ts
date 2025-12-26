import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Defer admin check to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            if (isMounted) checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;
        
        // Handle error (e.g., invalid refresh token)
        if (error) {
          console.warn('Session retrieval error:', error.message);
          // Clear stale auth tokens from localStorage
          localStorage.removeItem('sb-rdstyfaveeokocztayri-auth-token');
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          checkAdminRole(session.user.id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Session check failed:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!error && data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Redirect to /auth after email verification so user can sign in
    const redirectUrl = `${window.location.origin}/auth?verified=true`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const emailVerified = user?.email_confirmed_at != null;

  return {
    user,
    session,
    loading,
    isAdmin,
    emailVerified,
    signIn,
    signUp,
    signOut,
  };
}
