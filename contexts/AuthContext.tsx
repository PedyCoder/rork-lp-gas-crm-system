import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { UserRole } from '@/types/client';
import { trpcClient } from '@/lib/trpc';

const STORAGE_KEY = '@crm_auth';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const MOCK_USERS: (AuthUser & { password: string })[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@lpgas.com',
    password: 'sales123',
    role: 'sales',
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@lpgas.com',
    password: 'sales123',
    role: 'sales',
  },
  {
    id: '3',
    name: 'Carlos López',
    email: 'carlos@lpgas.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'manager1',
    name: 'Manager Demo',
    email: 'manager@lpgas.com',
    password: 'manager123',
    role: 'admin',
  },
];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAsUser, setViewingAsUser] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        const savedUser = JSON.parse(sessionData);
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Attempting login for:', email);
      const result = await trpcClient.users.authenticate.mutate({ email, password });

      if (!result.success) {
        console.log('Login failed:', result.error);
        return { success: false, error: result.error };
      }

      const authUser: AuthUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      console.log('Login successful for:', authUser.name);
      return { success: true };
    } catch (error) {
      console.error('Error during login:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Load failed') || error.message.includes('fetch')) {
          return { success: false, error: 'No se puede conectar al servidor. Verifique su conexión.' };
        }
        return { success: false, error: `Error: ${error.message}` };
      }
      
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setViewingAsUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  const switchViewToSalesRep = useCallback((salesRepId: string | null) => {
    if (user?.role === 'admin') {
      setViewingAsUser(salesRepId);
    }
  }, [user]);

  const getEffectiveUserId = useCallback((): string | null => {
    if (viewingAsUser && user?.role === 'admin') {
      return viewingAsUser;
    }
    return user?.id || null;
  }, [user, viewingAsUser]);

  const isManager = user?.role === 'admin';
  const isSales = user?.role === 'sales';

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isManager,
    isSales,
    viewingAsUser,
    login,
    logout,
    switchViewToSalesRep,
    getEffectiveUserId,
  };
});
