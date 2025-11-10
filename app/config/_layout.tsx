import { Stack } from 'expo-router';

export default function ConfigLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#0f172a',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="general-summary"
        options={{
          title: 'Resumen General',
        }}
      />
      <Stack.Screen
        name="sales-reps"
        options={{
          title: 'Vendedores Activos',
        }}
      />
      <Stack.Screen
        name="user-management"
        options={{
          title: 'Gestión de Usuarios',
        }}
      />
    </Stack>
  );
}
