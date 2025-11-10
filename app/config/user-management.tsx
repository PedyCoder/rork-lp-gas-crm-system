import { useAuth } from '@/contexts/AuthContext';
import { AREAS } from '@/constants/mockData';
import { UserPlus, Edit, Ban, CheckCircle, Activity, Users, UserX } from 'lucide-react-native';
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
} from 'react-native';
import { User, UserRole } from '@/types/client';

export default function UserManagementScreen() {
  const { user, createUser, updateUser, toggleUserStatus, getAllUsers } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sales' as UserRole,
    assignedArea: '',
    password: '',
  });

  const allUsers = useMemo(() => getAllUsers(), [getAllUsers]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'sales',
      assignedArea: '',
      password: '',
    });
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    const result = await createUser(formData);
    if (result.success) {
      Alert.alert('Éxito', 'Usuario creado exitosamente');
      setShowCreateModal(false);
      resetForm();
    } else {
      Alert.alert('Error', result.error || 'Error al crear usuario');
    }
  };

  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      assignedArea: userToEdit.assignedArea || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    const updates: Partial<User & { password?: string }> = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      assignedArea: formData.assignedArea,
    };

    if (formData.password) {
      updates.password = formData.password;
    }

    const result = await updateUser(selectedUser.id, updates);
    if (result.success) {
      Alert.alert('Éxito', 'Usuario actualizado exitosamente');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } else {
      Alert.alert('Error', result.error || 'Error al actualizar usuario');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    Alert.alert(
      `¿${action.charAt(0).toUpperCase() + action.slice(1)} usuario?`,
      `¿Está seguro que desea ${action} este usuario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            const result = await toggleUserStatus(userId);
            if (result.success) {
              Alert.alert('Éxito', `Usuario ${action}do exitosamente`);
            } else {
              Alert.alert('Error', result.error || `Error al ${action} usuario`);
            }
          },
        },
      ]
    );
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Usuarios del Sistema</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.7}
          >
            <UserPlus color="#fff" size={18} />
            <Text style={styles.createButtonText}>Crear Usuario</Text>
          </TouchableOpacity>
        </View>

        {allUsers.map((u) => (
          <View key={u.id} style={[styles.userCard, !u.isActive && styles.userCardInactive]}>
            <View style={styles.userCardHeader}>
              <View style={styles.userCardLeft}>
                <View style={[styles.userIcon, { backgroundColor: u.role === 'admin' ? '#8b5cf6' : '#3b82f6' }]}>
                  {u.role === 'admin' ? <Users color="#fff" size={20} /> : <UserX color="#fff" size={20} />}
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{u.name}</Text>
                    {!u.isActive && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>Inactivo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <View style={styles.userMetaRow}>
                    <Text style={styles.userRole}>{u.role === 'admin' ? 'Gerente' : 'Vendedor'}</Text>
                    {u.assignedArea && (
                      <Text style={styles.userArea}> • {u.assignedArea}</Text>
                    )}
                  </View>
                  {u.lastActive && (
                    <View style={styles.lastActiveRow}>
                      <Activity size={12} color="#94a3b8" />
                      <Text style={styles.lastActiveText}>Activo: {new Date(u.lastActive).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditUser(u)}
                activeOpacity={0.7}
              >
                <Edit color="#3b82f6" size={18} />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
              {u.id !== user?.id && (
                <TouchableOpacity
                  style={[styles.actionButton, !u.isActive && styles.actionButtonSuccess]}
                  onPress={() => handleToggleStatus(u.id, u.isActive || false)}
                  activeOpacity={0.7}
                >
                  {u.isActive ? <Ban color="#ef4444" size={18} /> : <CheckCircle color="#10b981" size={18} />}
                  <Text style={[styles.actionButtonText, !u.isActive && styles.actionButtonTextSuccess]}>
                    {u.isActive ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Nuevo Usuario</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nombre completo"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Correo Electrónico *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Rol *</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, formData.role === 'sales' && styles.roleButtonActive]}
                onPress={() => setFormData({ ...formData, role: 'sales' })}
              >
                <Text style={[styles.roleButtonText, formData.role === 'sales' && styles.roleButtonTextActive]}>
                  Vendedor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, formData.role === 'admin' && styles.roleButtonActive]}
                onPress={() => setFormData({ ...formData, role: 'admin' })}
              >
                <Text style={[styles.roleButtonText, formData.role === 'admin' && styles.roleButtonTextActive]}>
                  Gerente
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Contraseña Temporal *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Contraseña"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
              <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
                <Text style={styles.generateButtonText}>Generar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateUser}>
                <Text style={styles.saveButtonText}>Crear Usuario</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Usuario</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nombre completo"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Correo Electrónico *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Rol *</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, formData.role === 'sales' && styles.roleButtonActive]}
                onPress={() => setFormData({ ...formData, role: 'sales' })}
              >
                <Text style={[styles.roleButtonText, formData.role === 'sales' && styles.roleButtonTextActive]}>
                  Vendedor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, formData.role === 'admin' && styles.roleButtonActive]}
                onPress={() => setFormData({ ...formData, role: 'admin' })}
              >
                <Text style={[styles.roleButtonText, formData.role === 'admin' && styles.roleButtonTextActive]}>
                  Gerente
                </Text>
              </TouchableOpacity>
            </View>

            {formData.role === 'sales' && (
              <View>
                <Text style={styles.label}>Área Asignada</Text>
                <View style={styles.areaButtons}>
                  {AREAS.map((area) => (
                    <TouchableOpacity
                      key={area}
                      style={[styles.areaButton, formData.assignedArea === area && styles.areaButtonActive]}
                      onPress={() => setFormData({ ...formData, assignedArea: area })}
                    >
                      <Text style={[styles.areaButtonText, formData.assignedArea === area && styles.areaButtonTextActive]}>
                        {area}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.label}>Nueva Contraseña (opcional)</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Dejar en blanco para no cambiar"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
              <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
                <Text style={styles.generateButtonText}>Generar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateUser}>
                <Text style={styles.saveButtonText}>Actualizar Usuario</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  userCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  userIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  inactiveBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#8b5cf6',
  },
  userArea: {
    fontSize: 13,
    color: '#64748b',
  },
  lastActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  lastActiveText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonSuccess: {
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  actionButtonTextSuccess: {
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  roleButtonTextActive: {
    color: '#3b82f6',
  },
  areaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  areaButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  areaButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  areaButtonTextActive: {
    color: '#3b82f6',
  },
  passwordRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  passwordInput: {
    flex: 1,
  },
  generateButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  generateButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
