import { Tabs } from "expo-router";
import { LayoutDashboard, Users, UserPlus, Search, Settings } from "lucide-react-native";
import React from "react";
import NotificationBell from "@/components/NotificationBell";
import NavigationMenu from "@/components/NavigationMenu";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { isManager } = useAuth();

  return (
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
  );
}
