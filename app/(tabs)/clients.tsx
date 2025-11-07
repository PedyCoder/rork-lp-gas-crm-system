import { useCRM } from '@/contexts/CRMContext';
import { Client, ClientStatus, ClientType } from '@/types/client';
import { useRouter } from 'expo-router';
import { Search, Filter, MapPin, Phone, Mail, Plus, ChevronRight, X, CreditCard, DollarSign } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { AREAS } from '@/constants/mockData';

const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  residential: 'Residencial',
  restaurant: 'Restaurante',
  commercial: 'Comercial',
  food_truck: 'Food Truck',
  forklift: 'Montacargas',
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  new: 'Nuevo',
  in_progress: 'En Progreso',
  closed: 'Cerrado',
};

const STATUS_COLORS: Record<ClientStatus, string> = {
  new: '#6b7280',
  in_progress: '#f59e0b',
  closed: '#10b981',
};

export default function ClientsScreen() {
  const router = useRouter();
  const { clients, deleteClient, isLoading } = useCRM();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<ClientType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ClientStatus | 'all'>('all');
  const [selectedArea, setSelectedArea] = useState<string | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredClients = useMemo(() => {
    let filtered = clients;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(c => c.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }

    if (selectedArea !== 'all') {
      filtered = filtered.filter(c => c.area === selectedArea);
    }

    return filtered;
  }, [clients, searchQuery, selectedType, selectedStatus, selectedArea]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredClients.slice(start, end);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedArea('all');
  };

  const hasActiveFilters = selectedType !== 'all' || selectedStatus !== 'all' || selectedArea !== 'all';

  const handleDelete = (client: Client) => {
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
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#64748b" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color="#64748b" size={20} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Filter color={hasActiveFilters ? '#fff' : '#64748b'} size={20} />
        </TouchableOpacity>
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Filtros activos: {filteredClients.length} resultados
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {paginatedClients.map(client => (
          <TouchableOpacity
            key={client.id}
            style={styles.clientCard}
            onPress={() => router.push(`/client/${client.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.clientCardHeader}>
              <View style={styles.clientCardHeaderLeft}>
                <Text style={styles.clientName}>{client.name}</Text>
                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[client.status] }]}>
                    <Text style={styles.badgeText}>{STATUS_LABELS[client.status]}</Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{CLIENT_TYPE_LABELS[client.type]}</Text>
                  </View>
                </View>
              </View>
              <ChevronRight color="#94a3b8" size={20} />
            </View>

            <View style={styles.clientInfo}>
              <View style={styles.infoRow}>
                <MapPin color="#64748b" size={16} />
                <Text style={styles.infoText}>{client.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Phone color="#64748b" size={16} />
                <Text style={styles.infoText}>{client.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Mail color="#64748b" size={16} />
                <Text style={styles.infoText} numberOfLines={1}>{client.email}</Text>
              </View>
              {client.hasCredit && (
                <View style={styles.infoRow}>
                  <CreditCard color="#10b981" size={16} />
                  <Text style={[styles.infoText, styles.creditText]}>Crédito: {client.creditDays || 0} días</Text>
                </View>
              )}
              {client.hasDiscount && (
                <View style={styles.infoRow}>
                  <DollarSign color="#f59e0b" size={16} />
                  <Text style={[styles.infoText, styles.discountText]}>Descuento: ${client.discountAmount || 0} MXN</Text>
                </View>
              )}
            </View>

            <View style={styles.clientCardFooter}>
              <Text style={styles.assignedText}>Asignado: {client.assignedTo}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/edit-client/${client.id}`);
                  }}
                >
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(client);
                  }}
                >
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {paginatedClients.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron clientes</Text>
          </View>
        )}

        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                Anterior
              </Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Página {currentPage} de {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                Siguiente
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-client')}
        activeOpacity={0.8}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilters(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.filterSectionTitle}>Tipo de Cliente</Text>
              <View style={styles.filterOptionsGrid}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedType === 'all' && styles.filterOptionActive]}
                  onPress={() => setSelectedType('all')}
                >
                  <Text style={[styles.filterOptionText, selectedType === 'all' && styles.filterOptionTextActive]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {(Object.keys(CLIENT_TYPE_LABELS) as ClientType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterOption, selectedType === type && styles.filterOptionActive]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.filterOptionText, selectedType === type && styles.filterOptionTextActive]}>
                      {CLIENT_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Estado</Text>
              <View style={styles.filterOptionsGrid}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedStatus === 'all' && styles.filterOptionActive]}
                  onPress={() => setSelectedStatus('all')}
                >
                  <Text style={[styles.filterOptionText, selectedStatus === 'all' && styles.filterOptionTextActive]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterOption, selectedStatus === status && styles.filterOptionActive]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text style={[styles.filterOptionText, selectedStatus === status && styles.filterOptionTextActive]}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Área</Text>
              <View style={styles.filterOptionsGrid}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedArea === 'all' && styles.filterOptionActive]}
                  onPress={() => setSelectedArea('all')}
                >
                  <Text style={[styles.filterOptionText, selectedArea === 'all' && styles.filterOptionTextActive]}>
                    Todas
                  </Text>
                </TouchableOpacity>
                {AREAS.map(area => (
                  <TouchableOpacity
                    key={area}
                    style={[styles.filterOption, selectedArea === area && styles.filterOptionActive]}
                    onPress={() => setSelectedArea(area)}
                  >
                    <Text style={[styles.filterOptionText, selectedArea === area && styles.filterOptionTextActive]}>
                      {area}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Limpiar Filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500' as const,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600' as const,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientCardHeaderLeft: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#475569',
  },
  clientInfo: {
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  creditText: {
    color: '#10b981',
    fontWeight: '600' as const,
  },
  discountText: {
    color: '#f59e0b',
    fontWeight: '600' as const,
  },
  clientCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  assignedText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#475569',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  paginationButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  paginationButtonTextDisabled: {
    color: '#94a3b8',
  },
  paginationText: {
    fontSize: 14,
    color: '#64748b',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 20,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  filterOptionActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  filterOptionTextActive: {
    color: '#2563eb',
    fontWeight: '600' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#475569',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
