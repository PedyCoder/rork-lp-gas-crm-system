import { useCRM } from '@/contexts/CRMContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowDown, ArrowUp, TrendingUp, Users, UserCheck, CheckCircle2, Clock, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity, Modal, Pressable } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isManager, viewingAsUser } = useAuth();
  const { dashboardKPIs, isLoading, allVisitsFromHistory } = useCRM();
  const [showAllVisitsModal, setShowAllVisitsModal] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const kpis = dashboardKPIs;
  const visitsChange = kpis.visitsLastMonth > 0 
    ? ((kpis.visitsThisMonth - kpis.visitsLastMonth) / kpis.visitsLastMonth) * 100 
    : 0;
  const isPositiveChange = visitsChange >= 0;

  const last7DaysVisits = kpis.dailyVisits.slice(-7);
  const chartData = {
    labels: last7DaysVisits.map(d => {
      const date = new Date(d.date);
      return date.getDate().toString();
    }),
    datasets: [{
      data: last7DaysVisits.map(d => d.count),
    }],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panel de Control</Text>
          <Text style={styles.subtitle}>
            {isManager && viewingAsUser ? 'Vista de Vendedor' : 'Resumen Mensual'}
          </Text>
        </View>
        <View style={styles.userBadge}>
          <Text style={styles.userRole}>{isManager ? 'GERENTE' : 'VENDEDOR'}</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, styles.primaryCard]}>
          <View style={styles.kpiIconContainer}>
            <Users color="#fff" size={24} />
          </View>
          <Text style={styles.kpiValue}>{kpis.totalClients}</Text>
          <Text style={styles.kpiLabel}>Total Clientes</Text>
          <Text style={styles.kpiSubtext}>+{kpis.newClientsThisMonth} este mes</Text>
        </View>

        <TouchableOpacity 
          style={[styles.kpiCard, styles.warningCard]}
          onPress={() => router.push('/in-progress-clients')}
          activeOpacity={0.7}
        >
          <View style={styles.kpiIconContainer}>
            <UserCheck color="#fff" size={24} />
          </View>
          <Text style={styles.kpiValue}>{kpis.clientsInProgress}</Text>
          <Text style={styles.kpiLabel}>En Progreso</Text>
          <Text style={styles.kpiSubtext}>Requieren seguimiento</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.kpiCard, styles.successCard]}
          onPress={() => router.push('/closed-clients')}
          activeOpacity={0.7}
        >
          <View style={styles.kpiIconContainer}>
            <CheckCircle2 color="#fff" size={24} />
          </View>
          <Text style={styles.kpiValue}>{kpis.closedClients}</Text>
          <Text style={styles.kpiLabel}>Cerrados</Text>
          <Text style={styles.kpiSubtext}>Completados</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.kpiCard, styles.infoCard]}
          onPress={() => router.push('/monthly-visits')}
          activeOpacity={0.7}
        >
          <View style={styles.kpiIconContainer}>
            <TrendingUp color="#fff" size={24} />
          </View>
          <Text style={styles.kpiValue}>{kpis.visitsThisMonth}</Text>
          <Text style={styles.kpiLabel}>Visitas del Mes</Text>
          <View style={styles.changeContainer}>
            {isPositiveChange ? (
              <ArrowUp color="#10b981" size={16} />
            ) : (
              <ArrowDown color="#ef4444" size={16} />
            )}
            <Text style={[styles.changeText, { color: isPositiveChange ? '#10b981' : '#ef4444' }]}>
              {Math.abs(visitsChange).toFixed(1)}% vs mes anterior
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Visitas Últimos 7 Días</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.webChartContainer}>
            {last7DaysVisits.map((item, index) => {
              const maxCount = Math.max(...last7DaysVisits.map(d => d.count), 1);
              const height = (item.count / maxCount) * 150;
              return (
                <View key={index} style={styles.webBarContainer}>
                  <View style={styles.webBar}>
                    <View style={[styles.webBarFill, { height }]} />
                  </View>
                  <Text style={styles.webBarLabel}>{new Date(item.date).getDate()}</Text>
                  <Text style={styles.webBarValue}>{item.count}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <BarChart
            data={chartData}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e5e7eb',
                strokeWidth: 1,
              },
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        )}
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumen por Estado</Text>
        <View style={styles.summaryBar}>
          <View style={[styles.summarySegment, { flex: kpis.clientsInProgress, backgroundColor: '#f59e0b' }]} />
          <View style={[styles.summarySegment, { flex: kpis.closedClients, backgroundColor: '#10b981' }]} />
          <View style={[styles.summarySegment, { 
            flex: Math.max(kpis.totalClients - kpis.clientsInProgress - kpis.closedClients, 0), 
            backgroundColor: '#6b7280' 
          }]} />
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
            <Text style={styles.legendText}>Nuevos</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>En Progreso</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Cerrados</Text>
          </View>
        </View>
      </View>

      {kpis.recentVisits.length > 0 && (
        <View style={styles.recentVisitsContainer}>
          <View style={styles.recentVisitsHeader}>
            <Text style={styles.recentVisitsTitle}>Visitas Recientes</Text>
            {allVisitsFromHistory.length > 5 && (
              <TouchableOpacity onPress={() => setShowAllVisitsModal(true)}>
                <Text style={styles.viewAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
          {kpis.recentVisits.map(visit => (
            <TouchableOpacity
              key={visit.id}
              style={styles.visitCard}
              onPress={() => router.push(`/client/${visit.clientId}`)}
              activeOpacity={0.7}
            >
              <View style={styles.visitCardLeft}>
                <Text style={styles.visitClientName}>{visit.clientName}</Text>
                <Text style={styles.visitNotes} numberOfLines={1}>{visit.notes}</Text>
                <View style={styles.visitMeta}>
                  <Clock color="#94a3b8" size={14} />
                  <Text style={styles.visitDate}>
                    {new Date(visit.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.visitCreatedBy}>por {visit.createdBy}</Text>
                </View>
              </View>
              <ChevronRight color="#94a3b8" size={20} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        visible={showAllVisitsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllVisitsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAllVisitsModal(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Todas las Visitas</Text>
              <TouchableOpacity onPress={() => setShowAllVisitsModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {allVisitsFromHistory.map(visit => (
                <TouchableOpacity
                  key={visit.id}
                  style={styles.modalVisitCard}
                  onPress={() => {
                    setShowAllVisitsModal(false);
                    router.push(`/client/${visit.clientId}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.visitCardLeft}>
                    <Text style={styles.visitClientName}>{visit.clientName}</Text>
                    <Text style={styles.visitNotes} numberOfLines={2}>{visit.notes}</Text>
                    <View style={styles.visitMeta}>
                      <Clock color="#94a3b8" size={14} />
                      <Text style={styles.visitDate}>
                        {new Date(visit.date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.visitCreatedBy}>por {visit.createdBy}</Text>
                    </View>
                  </View>
                  <ChevronRight color="#94a3b8" size={20} />
                </TouchableOpacity>
              ))}
              {allVisitsFromHistory.length === 0 && (
                <View style={styles.emptyVisits}>
                  <Text style={styles.emptyVisitsText}>No hay visitas registradas</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  userBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginTop: 2,
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    borderRadius: 16,
    padding: 20,
  },
  primaryCard: {
    backgroundColor: '#2563eb',
  },
  warningCard: {
    backgroundColor: '#f59e0b',
  },
  successCard: {
    backgroundColor: '#10b981',
  },
  infoCard: {
    backgroundColor: '#8b5cf6',
  },
  kpiIconContainer: {
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  kpiSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  chartContainer: {
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
  chartTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  webChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
  },
  webBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  webBar: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  webBarFill: {
    width: '60%',
    backgroundColor: '#2563eb',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  webBarLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  webBarValue: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
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
  summaryBar: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  summarySegment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#64748b',
  },
  recentVisitsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentVisitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentVisitsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  visitCardLeft: {
    flex: 1,
    gap: 4,
  },
  visitClientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  visitNotes: {
    fontSize: 14,
    color: '#64748b',
  },
  visitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  visitDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  visitCreatedBy: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  closeButton: {
    fontSize: 28,
    color: '#64748b',
    fontWeight: '300' as const,
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalVisitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  emptyVisits: {
    padding: 40,
    alignItems: 'center',
  },
  emptyVisitsText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
