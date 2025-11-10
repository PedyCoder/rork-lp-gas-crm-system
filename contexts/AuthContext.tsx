import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { UserRole, User } from '@/types/client';

const STORAGE_KEY = '@crm_auth';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const USERS_STORAGE_KEY = '@crm_users';

let MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@lpgas.com',
    password: 'sales123',
    role: 'sales',
    assignedArea: 'García',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@lpgas.com',
    password: 'sales123',
    role: 'sales',
    assignedArea: 'Monterrey',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Carlos López',
    email: 'carlos@lpgas.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  },
  {
    id: 'manager1',
    name: 'Manager Demo',
    email: 'manager@lpgas.com',
    password: 'manager123',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  },
];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAsUser, setViewingAsUser] = useState<string | null>(null);
  const [users, setUsers] = useState<(User & { password: string })[]>(MOCK_USERS);

  useEffect(() => {
    loadSession();
    loadUsers();
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

  const loadUsers = async () => {
    try {
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (usersData) {
        const savedUsers = JSON.parse(usersData);
        MOCK_USERS = savedUsers;
        setUsers(savedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const saveUsers = async (updatedUsers: (User & { password: string })[]) => {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      MOCK_USERS = updatedUsers;
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const foundUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!foundUser) {
        return { success: false, error: 'Correo o contraseña incorrectos' };
      }

      if (!foundUser.isActive) {
        return { success: false, error: 'Cuenta desactivada' };
      }

      const authUser: AuthUser = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      };

      const updatedUsers = users.map(u => 
        u.id === foundUser.id ? { ...u, lastActive: new Date().toISOString() } : u
      );
      await saveUsers(updatedUsers);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }, [users]);

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

  const createUser = useCallback(async (userData: {
    name: string;
    email: string;
    role: UserRole;
    assignedArea?: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user?.role !== 'admin') {
        return { success: false, error: 'No tienes permisos para crear usuarios' };
      }

      const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUser) {
        return { success: false, error: 'El correo ya está en uso' };
      }

      const newUser: User & { password: string } = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        assignedArea: userData.assignedArea,
        password: userData.password,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      const updatedUsers = [...users, newUser];
      await saveUsers(updatedUsers);

      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Error al crear usuario' };
    }
  }, [user, users]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User & { password?: string }>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user?.role !== 'admin') {
        return { success: false, error: 'No tienes permisos para actualizar usuarios' };
      }

      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, ...updates } : u
      );
      await saveUsers(updatedUsers);

      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Error al actualizar usuario' };
    }
  }, [user, users]);

  const toggleUserStatus = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user?.role !== 'admin') {
        return { success: false, error: 'No tienes permisos para cambiar el estado de usuarios' };
      }

      if (userId === user.id) {
        return { success: false, error: 'No puedes desactivar tu propia cuenta' };
      }

      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      );
      await saveUsers(updatedUsers);

      return { success: true };
    } catch (error) {
      console.error('Error toggling user status:', error);
      return { success: false, error: 'Error al cambiar estado del usuario' };
    }
  }, [user, users]);

  const getAllUsers = useCallback((): User[] => {
    return users.map(({ password, ...user }) => user);
  }, [users]);

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
    createUser,
    updateUser,
    toggleUserStatus,
    getAllUsers,
  };
});
