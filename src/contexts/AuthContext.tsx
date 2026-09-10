import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string | null;
    role?: 'student' | 'faculty';
  };
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  userRole: 'student' | 'faculty';
  isLoading: boolean;
  error: string | null;
  signUp: (fullName: string, email: string, password: string, confirmPassword: string, role?: 'student' | 'faculty') => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  isCloudConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'faculty'>(() => {
    const saved = localStorage.getItem('knowiq_user_role');
    return saved === 'faculty' || saved === 'student' ? saved : 'student';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch or create profile for authenticated user
  const loadUserProfile = async (
    userId: string,
    userEmail?: string,
    metaFullName?: string,
    metaRole?: 'student' | 'faculty'
  ) => {
    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !profileErr) {
        const resolvedRole: 'student' | 'faculty' =
          (data.role as 'student' | 'faculty') ||
          metaRole ||
          ((localStorage.getItem('knowiq_user_role') as 'student' | 'faculty') || 'student');
        const userProf: UserProfile = { ...data, role: resolvedRole };
        setProfile(userProf);
        setUserRole(resolvedRole);
        localStorage.setItem('knowiq_user_role', resolvedRole);
      } else {
        // If profile doesn't exist yet, insert one
        const fallbackName = metaFullName || (userEmail ? userEmail.split('@')[0] : 'Student');
        const resolvedRole: 'student' | 'faculty' =
          metaRole ||
          ((localStorage.getItem('knowiq_user_role') as 'student' | 'faculty') || 'student');
        const newProfile: Partial<UserProfile> = {
          id: userId,
          full_name: fallbackName,
          email: userEmail || '',
          avatar_url: null,
          role: resolvedRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select();

        if (inserted && inserted.length > 0) {
          setProfile(inserted[0] as UserProfile);
        } else {
          setProfile(newProfile as UserProfile);
        }
        setUserRole(resolvedRole);
        localStorage.setItem('knowiq_user_role', resolvedRole);
      }
    } catch {
      // Fallback
      const resolvedRole: 'student' | 'faculty' =
        metaRole ||
        ((localStorage.getItem('knowiq_user_role') as 'student' | 'faculty') || 'student');
      setProfile({
        id: userId,
        full_name: metaFullName || 'Student',
        email: userEmail || '',
        avatar_url: null,
        role: resolvedRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setUserRole(resolvedRole);
      localStorage.setItem('knowiq_user_role', resolvedRole);
    }
  };

  // Listen to Supabase auth state changes and initial session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user && isMounted) {
          setUser(data.session.user);
          await loadUserProfile(
            data.session.user.id,
            data.session.user.email,
            data.session.user.user_metadata?.full_name,
            data.session.user.user_metadata?.role
          );
        }
      } catch (e: any) {
        console.error('Session init error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name,
          session.user.user_metadata?.role
        );
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authSubscription?.subscription?.unsubscribe();
    };
  }, []);

  // Validation helper
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  // Sign up action
  const signUp = async (
    fullName: string,
    emailStr: string,
    passwordStr: string,
    confirmPasswordStr: string,
    role: 'student' | 'faculty' = 'student'
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const cleanName = fullName.trim();
    const cleanEmail = emailStr.trim().toLowerCase();

    if (!cleanName) {
      const err = 'Please enter your full name.';
      setError(err);
      return { success: false, error: err };
    }

    if (!validateEmail(cleanEmail)) {
      const err = 'Please enter a valid email address.';
      setError(err);
      return { success: false, error: err };
    }

    if (passwordStr.length < 6) {
      const err = 'Password must be at least 6 characters long.';
      setError(err);
      return { success: false, error: err };
    }

    if (passwordStr !== confirmPasswordStr) {
      const err = 'Passwords do not match.';
      setError(err);
      return { success: false, error: err };
    }

    try {
      localStorage.setItem('knowiq_user_role', role);
      setUserRole(role);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: passwordStr,
        options: {
          data: {
            full_name: cleanName,
            role: role,
          },
        },
      });

      if (signUpError) {
        let msg = signUpError.message || 'Signup failed. Please try again.';
        if (
          signUpError.message?.toLowerCase().includes('rate limit') ||
          (signUpError as any).code === 'over_email_send_rate_limit'
        ) {
          msg = 'Supabase email rate limit exceeded. Please go to your Supabase Dashboard → Authentication → Providers → Email, turn OFF "Confirm email" and click Save. This disables email sending and allows instant signups without any rate limit.';
        }
        setError(msg);
        return { success: false, error: msg };
      }

      if (data?.user) {
        if (!data.session) {
          const info = 'Account registered! Please confirm your email address, or turn off "Confirm email" in your Supabase Auth settings to sign in immediately.';
          setError(info);
          return { success: false, error: info };
        }
        setUser(data.user);
        await loadUserProfile(data.user.id, data.user.email, cleanName, role);
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred during signup.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Login action
  const login = async (
    emailStr: string,
    passwordStr: string
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const cleanEmail = emailStr.trim().toLowerCase();

    if (!validateEmail(cleanEmail)) {
      const err = 'Please enter a valid email address.';
      setError(err);
      return { success: false, error: err };
    }

    if (!passwordStr) {
      const err = 'Please enter your password.';
      setError(err);
      return { success: false, error: err };
    }

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordStr,
      });

      if (loginError) {
        const msg = loginError.message || 'Invalid email or password.';
        setError(msg);
        return { success: false, error: msg };
      }

      if (data?.user) {
        setUser(data.user);
        await loadUserProfile(
          data.user.id,
          data.user.email,
          data.user.user_metadata?.full_name,
          data.user.user_metadata?.role
        );
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Unable to log in. Please check your credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      setProfile(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        userRole,
        isLoading,
        error,
        signUp,
        login,
        logout,
        clearError: () => setError(null),
        isCloudConnected: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
