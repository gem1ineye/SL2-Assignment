import { useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { authApi, setAuthToken } from '../services/api';
import type { User, UserRole } from '../types';

export function useAuth() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUser = useCallback(async () => {
    if (!clerkLoaded) return;

    if (!isSignedIn || !clerkUser) {
      setDbUser(null);
      setIsLoading(false);
      setAuthToken(null);
      return;
    }

    try {
      // Get token from Clerk
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      setAuthToken(token);

      // Try to fetch existing user from our DB
      try {
        const user = await authApi.getMe();
        setDbUser(user);
      } catch (err: any) {
        // If user doesn't exist in DB yet (401), that's expected for first-time login
        if (err?.response?.status === 401) {
          setDbUser(null);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error('Auth sync error:', err);
      setError(err?.response?.data?.error?.message || 'Failed to sync user');
    } finally {
      setIsLoading(false);
    }
  }, [clerkLoaded, isSignedIn, clerkUser, getToken]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  const registerUser = async (role: UserRole, institutionId?: string) => {
    if (!clerkUser) throw new Error('Not signed in');

    const token = await getToken();
    if (!token) throw new Error('Could not get auth token');
    setAuthToken(token);

    const user = await authApi.register({
      clerkUserId: clerkUser.id,
      name: clerkUser.fullName || clerkUser.firstName || 'User',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      role,
      institutionId,
    });

    setDbUser(user);
    return user;
  };

  const refreshToken = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
      }
    } catch {
      console.error('Failed to refresh token');
    }
  };

  return {
    user: dbUser,
    clerkUser,
    isLoading: !clerkLoaded || isLoading,
    isSignedIn: !!isSignedIn,
    isRegistered: !!dbUser,
    error,
    registerUser,
    refreshToken,
    refreshUser: syncUser,
  };
}
