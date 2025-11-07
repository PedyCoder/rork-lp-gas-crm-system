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
import { router, Stack } from 'expo-router';
import { Users, UserPlus, Edit, Power, Clock, TrendingUp, ChevronLeft } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { User } from '@/types/client';

export default function ManageUsersScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const usersQuery = trpc.users.list.useQuery();
  const createUserMutation = trpc.users.create.useMutation();
  const updateUserMutation = trpc.users.update.useMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sales' as 'admin' | 'sales',
    password: '',
  });

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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Gestionar Usuarios',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
              activeOpacity={0.7}
            >
              <ChevronLeft color="#0f172a" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Usuarios del Sistema</Text>
            <Text style={styles.subtitle}>
              Gestione usuarios, roles y permisos de acceso
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            activeOpacity={0.7}
          >
            <UserPlus color="#fff" size={20} />
            <Text style={styles.createButtonText}>Crear Usuario</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {usersQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Cargando usuarios...</Text>
            </View>
          ) : allUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users color="#cbd5e1" size={64} />
              <Text style={styles.emptyTitle}>No hay usuarios registrados</Text>
              <Text style={styles.emptyText}>
                Cree su primer usuario para comenzar
              </Text>
            </View>
          ) : (
            allUsers.map((userItem: User) => (
              <View
                key={userItem.id}
                style={[styles.userCard, !userItem.isActive && styles.userCardInactive]}
              >
                <View style={styles.userCardHeader}>
                  <View style={styles.userCardLeft}>
                    <View
                      style={[
                        styles.userIcon,
                        { backgroundColor: userItem.role === 'admin' ? '#8b5cf6' : '#3b82f6' },
                      ]}
                    >
                      <Users color="#fff" size={22} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{userItem.name}</Text>
                      <Text style={styles.userEmail}>{userItem.email}</Text>
                      <View style={styles.userMeta}>
                        <View
                          style={[
                            styles.roleBadge,
                            userItem.role === 'admin'
                              ? styles.roleBadgeAdmin
                              : styles.roleBadgeSales,
                          ]}
                        >
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
                      Último acceso:{' '}
                      {userItem.lastLogin
                        ? new Date(userItem.lastLogin).toLocaleDateString('es-ES')
                        : 'Nunca'}
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
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: userItem.isActive ? '#ef4444' : '#10b981' },
                      ]}
                    >
                      {userItem.isActive ? 'Desactivar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Crear Nuevo Usuario</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Nombre Completo</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                  placeholder="Ej: Juan Pérez"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.inputLabel}>Correo Electrónico</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                  placeholder="usuario@lpgas.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Rol</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formData.role === 'sales' && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, role: 'sales' }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === 'sales' && styles.roleOptionTextActive,
                      ]}
                    >
                      Ventas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formData.role === 'admin' && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, role: 'admin' }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === 'admin' && styles.roleOptionTextActive,
                      ]}
                    >
                      Manager
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Contraseña Temporal</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, password: text }))
                    }
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
              </ScrollView>

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

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Nombre Completo</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                  placeholder="Ej: Juan Pérez"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.inputLabel}>Correo Electrónico</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                  placeholder="usuario@lpgas.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Rol</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formData.role === 'sales' && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, role: 'sales' }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === 'sales' && styles.roleOptionTextActive,
                      ]}
                    >
                      Ventas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formData.role === 'admin' && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, role: 'admin' }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === 'admin' && styles.roleOptionTextActive,
                      ]}
                    >
                      Manager
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Nueva Contraseña (Opcional)</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, password: text }))
                    }
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
              </ScrollView>

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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTextContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center' as const,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center' as const,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#334155',
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center' as const,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userCardInactive: {
    opacity: 0.6,
  },
  userCardHeader: {
    marginBottom: 14,
  },
  userCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  userIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#991b1b',
  },
  userStats: {
    flexDirection: 'row' as const,
    gap: 20,
    marginBottom: 14,
    paddingTop: 4,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  statText: {
    fontSize: 13,
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
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionButtonDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionButtonText: {
    fontSize: 14,
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 20,
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
