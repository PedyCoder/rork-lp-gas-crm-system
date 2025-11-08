import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  X,
  LayoutDashboard,
  Users,
  UserPlus,
  Search,
  Settings,
  LogOut,
} from 'lucide-react-native';

const WINDOW_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = Math.min(WINDOW_WIDTH * 0.75, 320);

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  route: string;
  isActive: boolean;
  onPress: () => void;
}

const MenuItem = ({ icon, label, route, isActive, onPress }: MenuItemProps) => {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isActive && styles.menuItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemIcon}>
        <Text>{icon}</Text>
      </View>
      <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isManager, logout } = useAuth();
  const [slideAnim] = useState(new Animated.Value(-MENU_WIDTH));

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -MENU_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const handleLogout = () => {
    onClose();
    logout();
    router.replace('/login');
  };

  const menuItems = [
    {
      icon: <LayoutDashboard color={pathname === '/' ? '#2563eb' : '#64748b'} size={24} />,
      label: 'Dashboard',
      route: '/',
      visible: true,
    },
    {
      icon: <Users color={pathname === '/clients' ? '#2563eb' : '#64748b'} size={24} />,
      label: 'Clientes',
      route: '/clients',
      visible: true,
    },
    {
      icon: <Search color={pathname === '/search' ? '#2563eb' : '#64748b'} size={24} />,
      label: 'Búsqueda Avanzada',
      route: '/search',
      visible: true,
    },
    {
      icon: <UserPlus color={pathname === '/add-client' ? '#2563eb' : '#64748b'} size={24} />,
      label: 'Agregar Cliente',
      route: '/add-client',
      visible: true,
    },
    {
      icon: <Settings color={pathname === '/management' ? '#2563eb' : '#64748b'} size={24} />,
      label: 'Configuración',
      route: '/management',
      visible: isManager,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.menuContainer} onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.menu,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userRole}>
                  {isManager ? 'GERENTE' : 'VENDEDOR'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.menuItems}>
              {menuItems
                .filter((item) => item.visible)
                .map((item) => (
                  <MenuItem
                    key={item.route}
                    icon={item.icon}
                    label={item.label}
                    route={item.route}
                    isActive={pathname === item.route}
                    onPress={() => handleNavigate(item.route)}
                  />
                ))}
            </View>

            <View style={styles.menuFooter}>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <LogOut color="#ef4444" size={20} />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  menu: {
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
  },
  menuItems: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  menuItemTextActive: {
    color: '#2563eb',
    fontWeight: '600' as const,
  },
  menuFooter: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginTop: 12,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
});
