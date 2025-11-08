import { useAuth } from '@/contexts/AuthContext';
import { useCRM } from '@/contexts/CRMContext';
import { SALES_REPS } from '@/constants/mockData';
import { Check, LogOut, TrendingUp, Users, UserX } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

export default function ManagementScreen() {
  const { user, logout, switchViewToSalesRep, viewingAsUser } = useAuth();
  const { dashboardKPIs } = useCRM();

  const salesReps = useMemo(() => {
    return SALES_REPS.filter(rep => rep.role === 'sales');
  }, []);

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

      {viewingAsUser && (
        <View style={styles.activeViewBanner}>
          <Text style={styles.activeViewText}>
            Viendo datos de: {salesReps.find(r => r.id === viewingAsUser)?.name}
          </Text>
        </View>
      )}
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
});
