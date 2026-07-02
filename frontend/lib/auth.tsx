'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, getUserProfile, upgradeUserProfile } from './api';
import { supabase } from './supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  recoveryMode: boolean;
  setRecoveryMode: (val: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  upgradeAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Sync Supabase session state on mount and listen to changes
  useEffect(() => {
    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('ats_auth_token', session.access_token);
          setToken(session.access_token);
          try {
            const profile = await getUserProfile();
            setUser(profile);
          } catch (err) {
            console.error('Failed to retrieve user profile:', err);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    // Listen to changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('ats_auth_token', session.access_token);
        setToken(session.access_token);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          try {
            const profile = await getUserProfile();
            setUser(profile);
          } catch (err) {
            console.error('Failed to refresh user profile on auth change:', err);
          }
        }
      } else {
        localStorage.removeItem('ats_auth_token');
        setToken(null);
        setUser(null);
        setRecoveryMode(false);
      }

      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      await logout();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      localStorage.removeItem('ats_auth_token');
      setToken(null);
      setUser(null);
      setRecoveryMode(false);
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecoveryMode(false);
  };

  const upgradeAccount = async () => {
    if (!token) return;
    try {
      await upgradeUserProfile();
      await refreshProfile();
    } catch (err) {
      console.error('Failed to upgrade account:', err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const profile = await getUserProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      recoveryMode, 
      setRecoveryMode, 
      login, 
      register, 
      logout, 
      requestPasswordReset, 
      updatePassword, 
      upgradeAccount, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useEntitlements() {
  const { user } = useAuth();
  
  if (!user) {
    return {
      canGenerateAI: false,
      canExportReport: false,
      canCopySuggestions: false,
      isPremium: false,
      plan: 'none'
    };
  }

  const { entitlements, subscription_plan } = user;
  return {
    canGenerateAI: entitlements.can_generate_ai,
    canExportReport: entitlements.can_export_report,
    canCopySuggestions: entitlements.can_copy_suggestions,
    isPremium: subscription_plan === 'premium',
    plan: subscription_plan
  };
}
