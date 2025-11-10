import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, X, LayoutDashboard, Search, Users, Calendar, Settings, LogOut, UserPlus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function NavigationMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout, isManager, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    router.replace('/login');
  };

  const navigateTo = (path: string) => {
    setIsMenuOpen(false);
    router.push(path as any);
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/(tabs)/', visible: true },
    { label: 'Búsqueda', icon: Search, path: '/(tabs)/search', visible: true },
    { label: 'Clientes', icon: Users, path: '/(tabs)/clients', visible: true },
    { label: 'Agregar Cliente', icon: UserPlus, path: '/(tabs)/add-client', visible: true },
    { label: 'Visitas', icon: Calendar, path: '/monthly-visits', visible: true },
    { label: 'Configuración', icon: Settings, path: '/(tabs)/management', visible: isManager },
  ];

  return (
    <>
      <TouchableOpacity 
        onPress={() => setIsMenuOpen(true)}
        style={styles.menuButton}
      >
        <Menu color="#1e293b" size={24} />
      </TouchableOpacity>

      <Modal
        visible={isMenuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Pressable 
          style={styles.backdrop}
          onPress={() => setIsMenuOpen(false)}
        >
          <Pressable 
            style={styles.menuContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuTitle}>CRM - LP Gas</Text>
                <Text style={styles.userInfo}>{user?.name}</Text>
                <Text style={styles.userRole}>
                  {user?.role === 'admin' ? 'Gerente' : 'Vendedor'}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setIsMenuOpen(false)}
                style={styles.closeButton}
              >
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuItems}>
              {menuItems.map((item) => {
                if (!item.visible) return null;
                
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.path}
                    style={styles.menuItem}
                    onPress={() => navigateTo(item.path)}
                  >
                    <Icon color="#475569" size={20} />
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.menuFooter}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <LogOut color="#dc2626" size={20} />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#fff',
    width: 280,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#64748b',
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    flex: 1,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500' as const,
  },
  menuFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
});
