import { Tabs, useRouter } from "expo-router";
import { LayoutDashboard, Users, UserPlus, Search, Settings, Calendar } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import NotificationBell from "@/components/NotificationBell";
import NavigationMenu from "@/components/NavigationMenu";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { isManager } = useAuth();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#94a3b8',
          headerShown: true,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600' as const,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            headerTitle: "CRM - LP Gas",
            tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
            headerLeft: () => <NavigationMenu />,
            headerRight: () => <NotificationBell />,
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: "Clientes",
            headerTitle: "Clientes",
            tabBarIcon: ({ color }) => <Users color={color} size={24} />,
            headerLeft: () => <NavigationMenu />,
            headerRight: () => <NotificationBell />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Buscar",
            headerTitle: "Búsqueda Avanzada",
            tabBarIcon: ({ color }) => <Search color={color} size={24} />,
            headerLeft: () => <NavigationMenu />,
          }}
        />
        <Tabs.Screen
          name="add-client"
          options={{
            title: "Agregar",
            headerTitle: "Agregar Cliente",
            tabBarIcon: ({ color }) => <UserPlus color={color} size={24} />,
            headerLeft: () => <NavigationMenu />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowAddModal(true);
            },
          }}
        />
        <Tabs.Screen
          name="management"
          options={{
            title: "Configuración",
            headerTitle: "Configuración",
            tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
            headerLeft: () => <NavigationMenu />,
            href: isManager ? '/management' : null,
          }}
        />
      </Tabs>
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>¿Qué deseas agregar?</Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowAddModal(false);
                router.push('/(tabs)/add-client');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#2563eb' }]}>
                <UserPlus color="#fff" size={24} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Agregar Cliente</Text>
                <Text style={styles.optionDescription}>Crear un nuevo cliente</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowAddModal(false);
                router.push('/(tabs)/clients');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#10b981' }]}>
                <Calendar color="#fff" size={24} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Agregar Visita</Text>
                <Text style={styles.optionDescription}>Registrar visita a cliente existente</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
});
