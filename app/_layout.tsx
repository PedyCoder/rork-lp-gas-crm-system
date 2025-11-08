import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CRMProvider } from "@/contexts/CRMContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { Menu } from "lucide-react-native";
import SideMenu from "@/components/SideMenu";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Stack screenOptions={{ headerBackTitle: "Atrás" }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    );
  }

  const MenuButton = () => (
    <TouchableOpacity 
      onPress={() => setMenuVisible(true)}
      style={{ marginLeft: 16, padding: 8 }}
    >
      <Menu color="#0f172a" size={24} />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack 
        screenOptions={{ 
          headerBackTitle: "Atrás",
          headerLeft: () => <MenuButton />,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: "Dashboard",
            headerTitle: "CRM - LP Gas",
          }} 
        />
        <Stack.Screen 
          name="clients" 
          options={{ 
            title: "Clientes",
            headerTitle: "Clientes",
          }} 
        />
        <Stack.Screen 
          name="search" 
          options={{ 
            title: "Búsqueda Avanzada",
            headerTitle: "Búsqueda Avanzada",
          }} 
        />
        <Stack.Screen 
          name="add-client" 
          options={{ 
            title: "Agregar Cliente",
            headerTitle: "Agregar Cliente",
          }} 
        />
        <Stack.Screen 
          name="management" 
          options={{ 
            title: "Configuración",
            headerTitle: "Panel de Configuración",
          }} 
        />
        <Stack.Screen name="client/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="edit-client/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="in-progress-clients" options={{ headerShown: true }} />
        <Stack.Screen name="closed-clients" options={{ headerShown: true }} />
        <Stack.Screen name="monthly-visits" options={{ headerShown: true }} />
        <Stack.Screen name="manage-users" options={{ headerShown: true }} />
      </Stack>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CRMProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </CRMProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
