import { useAuth } from '@/contexts/AuthContext';
import { useCRM } from '@/contexts/CRMContext';
import { BarChart3, Users, Settings, ChevronRight } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

export default function ManagementScreen() {
  const { user } = useAuth();
  const { dashboardKPIs } = useCRM();

  const widgets = [
    {
      id: 'summary',
      title: 'Resumen General',
      description: 'KPIs, reportes y métricas globales',
      icon: BarChart3,
      color: '#3b82f6',
      route: '/config/general-summary',
      stats: [
        { label: 'Total Clientes', value: dashboardKPIs.totalClients },
        { label: 'Visitas del Mes', value: dashboardKPIs.visitsThisMonth },
      ],
    },
    {
      id: 'sales-reps',
      title: 'Vendedores Activos',
      description: 'Vista y análisis de desempeño',
      icon: Users,
      color: '#8b5cf6',
      route: '/config/sales-reps',
      stats: [
        { label: 'En Progreso', value: dashboardKPIs.clientsInProgress },
        { label: 'Cerrados', value: dashboardKPIs.closedClients },
      ],
    },
    {
      id: 'user-management',
      title: 'Gestión de Usuarios',
      description: 'Crear y administrar usuarios del sistema',
      icon: Settings,
      color: '#10b981',
      route: '/config/user-management',
      stats: [],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Bienvenido, {user?.name}</Text>
        </View>
      </View>

      <View style={styles.widgetsGrid}>
        {widgets.map((widget) => {
          const IconComponent = widget.icon;
          return (
            <TouchableOpacity
              key={widget.id}
              style={styles.widgetCard}
              onPress={() => router.push(widget.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.widgetHeader}>
                <View style={[styles.widgetIcon, { backgroundColor: widget.color }]}>
                  <IconComponent color="#fff" size={28} />
                </View>
                <View style={styles.widgetChevron}>
                  <ChevronRight color="#94a3b8" size={20} />
                </View>
              </View>
              
              <Text style={styles.widgetTitle}>{widget.title}</Text>
              <Text style={styles.widgetDescription}>{widget.description}</Text>
              
              {widget.stats.length > 0 && (
                <View style={styles.widgetStats}>
                  {widget.stats.map((stat, index) => (
                    <View key={index} style={styles.widgetStat}>
                      <Text style={styles.widgetStatValue}>{stat.value}</Text>
                      <Text style={styles.widgetStatLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
  widgetsGrid: {
    gap: 16,
  },
  widgetCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 6,
  },
  widgetDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  widgetStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  widgetStat: {
    flex: 1,
  },
  widgetStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  widgetStatLabel: {
    fontSize: 12,
    color: '#64748b',
  },
});
