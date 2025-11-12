import { useAuth } from '@/contexts/AuthContext';
import { Check, Users, UserCheck, MapPin } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function SalesRepsScreen() {
  const { switchViewToSalesRep, viewingAsUser, getAllUsers } = useAuth();

  const allUsers = useMemo(() => getAllUsers(), [getAllUsers]);
  const salesReps = useMemo(() => {
    return allUsers.filter(rep => rep.role === 'sales' && rep.isActive);
  }, [allUsers]);

  const repsByMunicipio = useMemo(() => {
    const grouped = new Map<string, number>();
    salesReps.forEach(rep => {
      if (rep.assignedArea) {
        grouped.set(rep.assignedArea, (grouped.get(rep.assignedArea) || 0) + 1);
      }
    });
    return Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]);
  }, [salesReps]);

  const handleSwitchView = (repId: string | null) => {
    switchViewToSalesRep(repId);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Cuentas Activas de Vendedores</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItemLarge}>
            <View style={styles.summaryIconLarge}>
              <UserCheck color="#3b82f6" size={32} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValueLarge}>{salesReps.length}</Text>
              <Text style={styles.summaryLabelLarge}>Vendedores Activos</Text>
            </View>
          </View>
        </View>
      </View>

      {repsByMunicipio.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribución por Municipio</Text>
          <View style={styles.municipioGrid}>
            {repsByMunicipio.map(([municipio, count]) => (
              <View key={municipio} style={styles.municipioCard}>
                <View style={styles.municipioIcon}>
                  <MapPin color="#8b5cf6" size={20} />
                </View>
                <View style={styles.municipioContent}>
                  <Text style={styles.municipioCount}>{count}</Text>
                  <Text style={styles.municipioName}>{municipio}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perfiles de Vendedores</Text>
        <Text style={styles.sectionDescription}>
          Ver perfil y detalles de cada vendedor activo
        </Text>

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
                  <UserCheck color="#fff" size={20} />
                </View>
                <View style={styles.repInfo}>
                  <Text style={styles.repName}>{rep.name}</Text>
                  <Text style={styles.repEmail}>{rep.email}</Text>
                  {rep.assignedArea && (
                    <View style={styles.repAreaBadge}>
                      <MapPin color="#8b5cf6" size={12} />
                      <Text style={styles.repArea}>{rep.assignedArea}</Text>
                    </View>
                  )}
                  {rep.lastActive && (
                    <Text style={styles.repLastActive}>
                      Última actividad: {new Date(rep.lastActive).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
              </View>
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
  },
  summaryItemLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    gap: 16,
  },
  summaryIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryValueLarge: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 4,
  },
  summaryLabelLarge: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600' as const,
  },
  municipioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  municipioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  municipioIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  municipioContent: {
    flex: 1,
  },
  municipioCount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  municipioName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  repCardActive: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
  },
  repCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  repIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repInfo: {
    flex: 1,
  },
  repName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  repEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  repAreaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  repArea: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600' as const,
  },
  repLastActive: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
