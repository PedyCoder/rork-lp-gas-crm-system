import { useAuth } from '@/contexts/AuthContext';
import { useCRM } from '@/contexts/CRMContext';
import { SALES_REPS } from '@/constants/mockData';
import { Check, LogOut, TrendingUp, Users, UserX, UserPlus, Edit, Power, Clock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { User } from '@/types/client';

export default function ManagementScreen() {
  const { user, logout, switchViewToSalesRep, viewingAsUser } = useAuth();
  const { dashboardKPIs } = useCRM();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

  const usersQuery = trpc.users.list.useQuery();
  const createUserMutation = trpc.users.create.useMutation();
  const updateUserMutation = trpc.users.update.useMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sales' as 'admin' | 'sales',
    password: '',
  });

  const salesReps = useMemo(() => {
    return SALES_REPS.filter(rep => rep.role === 'sales');
  }, []);

  const allUsers = useMemo(() => {
    return usersQuery.data || [];
  }, [usersQuery.data]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'sales',
      password: '',
    });
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    try {
      await createUserMutation.mutateAsync(formData);
      Alert.alert('Éxito', 'Usuario creado exitosamente');
      setShowCreateModal(false);
      resetForm();
      usersQuery.refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear usuario');
    }
  };

  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const updateData: any = {
        id: selectedUser.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateUserMutation.mutateAsync(updateData);
      Alert.alert('Éxito', 'Usuario actualizado exitosamente');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      usersQuery.refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar usuario');
    }
  };

  const handleToggleActive = async (userToToggle: User) => {
    Alert.alert(
      userToToggle.isActive ? 'Desactivar Usuario' : 'Activar Usuario',
      `¿Está seguro que desea ${userToToggle.isActive ? 'desactivar' : 'activar'} a ${userToToggle.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: userToToggle.isActive ? 'Desactivar' : 'Activar',
          style: userToToggle.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateUserMutation.mutateAsync({
                id: userToToggle.id,
                isActive: !userToToggle.isActive,
              });
              usersQuery.refetch();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error al actualizar usuario');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro que desea cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleSwitchView = (repId: string | null) => {
    switchViewToSalesRep(repId);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panel de Gerencia</Text>
          <Text style={styles.subtitle}>Bienvenido, {user?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut color="#ef4444" size={20} />
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Resumen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Gestionar Usuarios
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen General</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Users color="#2563eb" size={24} />
            <Text style={styles.summaryValue}>{dashboardKPIs.totalClients}</Text>
            <Text style={styles.summaryLabel}>Total Clientes</Text>
          </View>
          <View style={styles.summaryItem}>
            <TrendingUp color="#10b981" size={24} />
            <Text style={styles.summaryValue}>{dashboardKPIs.visitsThisMonth}</Text>
            <Text style={styles.summaryLabel}>Visitas del Mes</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vista de Vendedores</Text>
        <Text style={styles.sectionDescription}>
          Seleccione un vendedor para ver sus datos o seleccione "Ver Todos" para ver todos los clientes
        </Text>

        <TouchableOpacity
          style={[
            styles.repCard,
            !viewingAsUser && styles.repCardActive,
          ]}
          onPress={() => handleSwitchView(null)}
          activeOpacity={0.7}
        >
          <View style={styles.repCardLeft}>
            <View style={[styles.repIcon, { backgroundColor: '#8b5cf6' }]}>
              <Users color="#fff" size={20} />
            </View>
            <View>
              <Text style={styles.repName}>Ver Todos</Text>
              <Text style={styles.repEmail}>Acceso completo a todos los datos</Text>
            </View>
          </View>
          {!viewingAsUser && (
            <View style={styles.checkIcon}>
              <Check color="#10b981" size={20} />
            </View>
          )}
        </TouchableOpacity>

        {salesReps.map(rep => {
          const isActive = viewingAsUser === rep.id;
          return (
            <TouchableOpacity
              key={rep.id}
              style={[
                styles.repCard,
                isActive && styles.repCardActive,
              ]}
              onPress={() => handleSwitchView(rep.id)}
              activeOpacity={0.7}
            >
              <View style={styles.repCardLeft}>
                <View style={[styles.repIcon, { backgroundColor: '#3b82f6' }]}>
                  <UserX color="#fff" size={20} />
                </View>
                <View>
                  <Text style={styles.repName}>{rep.name}</Text>
                  <Text style={styles.repEmail}>{rep.email}</Text>
                </View>
              </View>
              {isActive && (
                <View style={styles.checkIcon}>
                  <Check color="#10b981" size={20} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {viewingAsUser && activeTab === 'overview' && (
        <View style={styles.activeViewBanner}>
          <Text style={styles.activeViewText}>
            Viendo datos de: {salesReps.find(r => r.id === viewingAsUser)?.name}
          </Text>
        </View>
      )}

      {activeTab === 'users' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Usuarios del Sistema</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              activeOpacity={0.7}
            >
              <UserPlus color="#fff" size={18} />
              <Text style={styles.createButtonText}>Crear Usuario</Text>
            </TouchableOpacity>
          </View>

          {usersQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : allUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users color="#cbd5e1" size={48} />
              <Text style={styles.emptyText}>No hay usuarios registrados</Text>
            </View>
          ) : (
            allUsers.map((userItem: User) => (
              <View
                key={userItem.id}
                style={[styles.userCard, !userItem.isActive && styles.userCardInactive]}
              >
                <View style={styles.userCardHeader}>
                  <View style={styles.userCardLeft}>
                    <View style={[styles.userIcon, { backgroundColor: userItem.role === 'admin' ? '#8b5cf6' : '#3b82f6' }]}>
                      <Users color="#fff" size={20} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{userItem.name}</Text>
                      <Text style={styles.userEmail}>{userItem.email}</Text>
                      <View style={styles.userMeta}>
                        <View style={[styles.roleBadge, userItem.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeSales]}>
                          <Text style={styles.roleBadgeText}>
                            {userItem.role === 'admin' ? 'Manager' : 'Ventas'}
                          </Text>
                        </View>
                        {!userItem.isActive && (
                          <View style={styles.inactiveBadge}>
                            <Text style={styles.inactiveBadgeText}>Inactivo</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.userStats}>
                  <View style={styles.statItem}>
                    <Clock color="#64748b" size={14} />
                    <Text style={styles.statText}>
                      Último acceso: {userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <TrendingUp color="#64748b" size={14} />
                    <Text style={styles.statText}>
                      Inicios de sesión: {userItem.loginCount || 0}
                    </Text>
                  </View>
                </View>

                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditUser(userItem)}
                    activeOpacity={0.7}
                  >
                    <Edit color="#3b82f6" size={16} />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => handleToggleActive(userItem)}
                    activeOpacity={0.7}
                  >
                    <Power color={userItem.isActive ? '#ef4444' : '#10b981'} size={16} />
                    <Text style={[styles.actionButtonText, { color: userItem.isActive ? '#ef4444' : '#10b981' }]}>
                      {userItem.isActive ? 'Desactivar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Nuevo Usuario</Text>

            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="usuario@lpgas.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Rol</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleOption, formData.role === 'sales' && styles.roleOptionActive]}
                onPress={() => setFormData(prev => ({ ...prev, role: 'sales' }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.roleOptionText, formData.role === 'sales' && styles.roleOptionTextActive]}>
                  Ventas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, formData.role === 'admin' && styles.roleOptionActive]}
                onPress={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.roleOptionText, formData.role === 'admin' && styles.roleOptionTextActive]}>
                  Manager
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Contraseña Temporal</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="Ingrese contraseña"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generatePassword}
                activeOpacity={0.7}
              >
                <Text style={styles.generateButtonText}>Generar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleCreateUser}
                activeOpacity={0.7}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Crear Usuario</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Usuario</Text>

            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="usuario@lpgas.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Rol</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleOption, formData.role === 'sales' && styles.roleOptionActive]}
                onPress={() => setFormData(prev => ({ ...prev, role: 'sales' }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.roleOptionText, formData.role === 'sales' && styles.roleOptionTextActive]}>
                  Ventas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, formData.role === 'admin' && styles.roleOptionActive]}
                onPress={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.roleOptionText, formData.role === 'admin' && styles.roleOptionTextActive]}>
                  Manager
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nueva Contraseña (Opcional)</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="Dejar vacío para mantener actual"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generatePassword}
                activeOpacity={0.7}
              >
                <Text style={styles.generateButtonText}>Generar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleUpdateUser}
                activeOpacity={0.7}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  repCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  repCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  repCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  repIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  repEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeViewBanner: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  activeViewText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  tabsContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center' as const,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center' as const,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center' as const,
  },
  userCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userCardInactive: {
    opacity: 0.6,
  },
  userCardHeader: {
    marginBottom: 12,
  },
  userCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  userIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeAdmin: {
    backgroundColor: '#f3e8ff',
  },
  roleBadgeSales: {
    backgroundColor: '#dbeafe',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  inactiveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#991b1b',
  },
  userStats: {
    flexDirection: 'row' as const,
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#64748b',
  },
  userActions: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionButtonDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#3b82f6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%' as const,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#334155',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleSelector: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  roleOptionTextActive: {
    color: '#3b82f6',
  },
  passwordContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    alignItems: 'center' as const,
  },
  passwordInput: {
    flex: 1,
  },
  generateButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  modalButtonCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalButtonCreate: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
});
