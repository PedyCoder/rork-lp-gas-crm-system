import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { Menu, X, LayoutDashboard, Users, Search, UserPlus, Settings, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  show: boolean;
}

export default function MenuButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { logout, isManager, user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    router.replace('/login');
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard color="#334155" size={20} />,
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(tabs)');
      },
      show: true,
    },
    {
      label: 'Clientes',
      icon: <Users color="#334155" size={20} />,
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(tabs)/clients');
      },
      show: true,
    },
    {
      label: 'Buscar',
      icon: <Search color="#334155" size={20} />,
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(tabs)/search');
      },
      show: true,
    },
    {
      label: 'Agregar Cliente',
      icon: <UserPlus color="#334155" size={20} />,
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(tabs)/add-client');
      },
      show: true,
    },
    {
      label: 'Configuración',
      icon: <Settings color="#334155" size={20} />,
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(tabs)/management');
      },
      show: isManager,
    },
  ];

  return (
    <>
      <TouchableOpacity 
        onPress={() => setIsMenuOpen(true)} 
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        <Menu color="#334155" size={24} />
      </TouchableOpacity>

      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsMenuOpen(false)}
        >
          <Pressable 
            style={[
              styles.menuContainer,
              Platform.OS === 'web' ? styles.menuContainerWeb : {},
              { paddingTop: insets.top + 12 }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuHeaderTitle}>Menú</Text>
                <Text style={styles.menuHeaderSubtitle}>{user?.name}</Text>
                <Text style={styles.menuHeaderRole}>
                  {isManager ? 'Manager' : 'Vendedor'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsMenuOpen(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.menuItems}>
              {menuItems
                .filter(item => item.show)
                .map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={item.onPress}
                    style={styles.menuItem}
                    activeOpacity={0.7}
                  >
                    {item.icon}
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <View style={styles.menuFooter}>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
                activeOpacity={0.7}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: 280,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuContainerWeb: {
    maxHeight: '100%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  menuHeaderTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  menuHeaderSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  menuHeaderRole: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600' as const,
  },
  closeButton: {
    padding: 4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
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
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500' as const,
  },
  menuFooter: {
    paddingBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600' as const,
  },
});
