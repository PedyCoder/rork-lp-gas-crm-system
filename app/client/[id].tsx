import { useCRM } from '@/contexts/CRMContext';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MapPin, Phone, Mail, Calendar, FileText, User, ArrowLeft, Edit, Trash2 } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

const CLIENT_TYPE_LABELS = {
  residential: 'Residencial',
  restaurant: 'Restaurante',
  commercial: 'Comercial',
  food_truck: 'Food Truck',
  forklift: 'Montacargas',
};

const STATUS_LABELS = {
  new: 'Nuevo',
  in_progress: 'En Progreso',
  closed: 'Cerrado',
};

const STATUS_COLORS = {
  new: '#6b7280',
  in_progress: '#f59e0b',
  closed: '#10b981',
};

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { clients, deleteClient } = useCRM();

  const client = clients.find(c => c.id === id);

  if (!client) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Cliente no encontrado' }} />
        <Text style={styles.errorText}>Cliente no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cliente',
      `¿Estás seguro de que deseas eliminar a ${client.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteClient(client.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: client.name,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push(`/edit-client/${client.id}` as any)}
              >
                <Edit color="#2563eb" size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                <Trash2 color="#ef4444" size={20} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.clientName}>{client.name}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[client.status] }]}>
              <Text style={styles.statusBadgeText}>{STATUS_LABELS[client.status]}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{CLIENT_TYPE_LABELS[client.type]}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Dirección</Text>
                <Text style={styles.infoValue}>{client.address}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Phone color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{client.phone}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Mail color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{client.email || 'No especificado'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <User color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Asignado a</Text>
                <Text style={styles.infoValue}>{client.assignedTo}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MapPin color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Área</Text>
                <Text style={styles.infoValue}>{client.area}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Última Visita</Text>
                <Text style={styles.infoValue}>
                  {client.lastVisit
                    ? new Date(client.lastVisit).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Sin visitas'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {client.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <View style={styles.notesCard}>
              <FileText color="#64748b" size={20} />
              <Text style={styles.notesText}>{client.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condiciones Comerciales</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FileText color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Crédito</Text>
                <Text style={styles.infoValue}>
                  {client.hasCredit
                    ? `Sí - ${client.creditDays || 0} días`
                    : 'No'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <FileText color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Descuento</Text>
                <Text style={styles.infoValue}>
                  {client.hasDiscount
                    ? `${client.discountAmount?.toFixed(2) || '0.00'} MXN`
                    : 'No'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {client.activityHistory && client.activityHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial de Actividad</Text>
            <View style={styles.infoCard}>
              {client.activityHistory
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((activity, index, arr) => (
                  <View key={activity.id}>
                    <View style={styles.activityItem}>
                      <View style={styles.activityIconContainer}>
                        {activity.type === 'visit' ? (
                          <Calendar color="#2563eb" size={18} />
                        ) : activity.type === 'follow_up' ? (
                          <Calendar color="#f59e0b" size={18} />
                        ) : (
                          <FileText color="#64748b" size={18} />
                        )}
                      </View>
                      <View style={styles.activityContent}>
                        <View style={styles.activityHeader}>
                          <Text style={styles.activityType}>
                            {activity.type === 'visit' ? 'Visita' : 
                             activity.type === 'follow_up' ? 'Seguimiento' : 'Nota'}
                          </Text>
                          <Text style={styles.activityDate}>
                            {new Date(activity.date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                        <Text style={styles.activityNotes}>{activity.notes}</Text>
                        <Text style={styles.activityCreatedBy}>Por {activity.createdBy}</Text>
                        {activity.nextFollowUpDate && (
                          <View style={styles.followUpBadge}>
                            <Calendar color="#f59e0b" size={14} />
                            <Text style={styles.followUpText}>
                              Seguimiento programado: {new Date(activity.nextFollowUpDate).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {index < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Sistema</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Calendar color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Fecha de Creación</Text>
                <Text style={styles.infoValue}>
                  {new Date(client.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Calendar color="#64748b" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Última Actualización</Text>
                <Text style={styles.infoValue}>
                  {new Date(client.updatedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  header: {
    marginBottom: 24,
  },
  clientName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notesText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  activityItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 6,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityType: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  activityDate: {
    fontSize: 13,
    color: '#94a3b8',
  },
  activityNotes: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  activityCreatedBy: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic' as const,
  },
  followUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  followUpText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600' as const,
  },
});
