import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { UserRole } from '@/types/client';

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
      const foundUser = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!foundUser) {
        return { success: false, error: 'Correo o contraseña incorrectos' };
      }

      const authUser: AuthUser = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch (error) {
      console.error('Error during login:', error);
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
