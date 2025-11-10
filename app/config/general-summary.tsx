import { useCRM } from '@/contexts/CRMContext';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function GeneralSummaryScreen() {
  const { dashboardKPIs } = useCRM();

  const kpiCards = [
    {
      id: 'total-clients',
      title: 'Total Clientes',
      value: dashboardKPIs.totalClients,
      icon: Users,
      color: '#3b82f6',
      bgColor: '#eff6ff',
    },
    {
      id: 'visits-month',
      title: 'Visitas del Mes',
      value: dashboardKPIs.visitsThisMonth,
      change: dashboardKPIs.visitsLastMonth > 0 
        ? ((dashboardKPIs.visitsThisMonth - dashboardKPIs.visitsLastMonth) / dashboardKPIs.visitsLastMonth * 100).toFixed(0)
        : 0,
      icon: TrendingUp,
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    {
      id: 'in-progress',
      title: 'En Progreso',
      value: dashboardKPIs.clientsInProgress,
      icon: Target,
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      id: 'closed',
      title: 'Cerrados',
      value: dashboardKPIs.closedClients,
      icon: BarChart3,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KPIs Principales</Text>
        <View style={styles.kpiGrid}>
          {kpiCards.map((kpi) => {
            const IconComponent = kpi.icon;
            return (
              <View key={kpi.id} style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: kpi.bgColor }]}>
                  <IconComponent color={kpi.color} size={24} />
                </View>
                <View style={styles.kpiContent}>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                  <Text style={styles.kpiTitle}>{kpi.title}</Text>
                  {kpi.change !== undefined && Number(kpi.change) !== 0 && (
                    <Text
                      style={[
                        styles.kpiChange,
                        Number(kpi.change) > 0 ? styles.kpiChangePositive : styles.kpiChangeNegative,
                      ]}
                    >
                      {Number(kpi.change) > 0 ? '+' : ''}{kpi.change}% vs mes anterior
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visitas Recientes</Text>
        {dashboardKPIs.recentVisits.length > 0 ? (
          dashboardKPIs.recentVisits.map((visit, index) => (
            <View key={`${visit.id}-${index}`} style={styles.visitCard}>
              <View style={styles.visitLeft}>
                <Text style={styles.visitClient}>{visit.clientName}</Text>
                <Text style={styles.visitNotes} numberOfLines={1}>{visit.notes}</Text>
                <Text style={styles.visitDate}>
                  {new Date(visit.date).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay visitas registradas</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nuevos Clientes del Mes</Text>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Users color="#3b82f6" size={32} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{dashboardKPIs.newClientsThisMonth}</Text>
            <Text style={styles.statLabel}>Clientes nuevos este mes</Text>
          </View>
        </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  kpiGrid: {
    gap: 16,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiContent: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  kpiTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  kpiChange: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  kpiChangePositive: {
    color: '#10b981',
  },
  kpiChangeNegative: {
    color: '#ef4444',
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  visitLeft: {
    flex: 1,
  },
  visitClient: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  visitNotes: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  visitDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
});
