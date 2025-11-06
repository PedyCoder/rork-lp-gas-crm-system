import { useCRM } from '@/contexts/CRMContext';
import { Client, ClientType } from '@/types/client';
import { useRouter } from 'expo-router';
import { Search, Filter, MapPin, Phone, Mail, ChevronRight, X, UserCircle, Clock, Download, Archive } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { AREAS, SALES_REPS } from '@/constants/mockData';
import { Stack } from 'expo-router';

const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  residential: 'Residencial',
  restaurant: 'Restaurante',
  commercial: 'Comercial',
  food_truck: 'Food Truck',
  forklift: 'Montacargas',
};

export default function ClosedClientsScreen() {
  const router = useRouter();
  const { getClientsByStatus, updateClient, deleteClient } = useCRM();
  const closedClients = getClientsByStatus('closed');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<ClientType | 'all'>('all');
  const [selectedArea, setSelectedArea] = useState<string | 'all'>('all');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string | 'all'>('all');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredClients = useMemo(() => {
    let filtered = closedClients;

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

    if (selectedArea !== 'all') {
      filtered = filtered.filter(c => c.area === selectedArea);
    }

    if (selectedSalesRep !== 'all') {
      filtered = filtered.filter(c => c.assignedTo === selectedSalesRep);
    }

    if (dateRangeStart) {
      const startDate = new Date(dateRangeStart);
      filtered = filtered.filter(c => {
        if (!c.lastVisit) return false;
        return new Date(c.lastVisit) >= startDate;
      });
    }

    if (dateRangeEnd) {
      const endDate = new Date(dateRangeEnd);
      filtered = filtered.filter(c => {
        if (!c.lastVisit) return false;
        return new Date(c.lastVisit) <= endDate;
      });
    }

    return filtered;
  }, [closedClients, searchQuery, selectedType, selectedArea, selectedSalesRep, dateRangeStart, dateRangeEnd]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredClients.slice(start, end);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedArea('all');
    setSelectedSalesRep('all');
    setDateRangeStart('');
    setDateRangeEnd('');
  };

  const hasActiveFilters = selectedType !== 'all' || selectedArea !== 'all' || selectedSalesRep !== 'all' || dateRangeStart || dateRangeEnd;

  const handleReopenClient = async (client: Client) => {
    Alert.alert(
      'Reabrir Cliente',
      `¿Deseas reabrir a ${client.name}? El estado cambiará a "En Progreso".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reabrir',
          onPress: async () => {
            await updateClient(client.id, { status: 'in_progress' });
            Alert.alert('Éxito', 'Cliente reabierto correctamente');
          },
        },
      ]
    );
  };

  const handleExport = () => {
    const csv = generateCSV(filteredClients);
    Alert.alert(
      'Exportar Datos',
      `Se exportarían ${filteredClients.length} clientes.\n\nFormato: CSV\n\nEn una aplicación real, esto descargaría el archivo.`,
      [{ text: 'Entendido', style: 'default' }]
    );
    console.log('CSV Data:', csv);
  };

  const generateCSV = (clientsList: Client[]): string => {
    const headers = ['Nombre', 'Tipo', 'Dirección', 'Teléfono', 'Email', 'Área', 'Asignado a', 'Última Visita'];
    const rows = clientsList.map(c => [
      c.name,
      CLIENT_TYPE_LABELS[c.type],
      c.address,
      c.phone,
      c.email,
      c.area,
      c.assignedTo,
      c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('es-ES') : 'N/A',
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleArchive = (client: Client) => {
    Alert.alert(
      'Archivar Cliente',
      `¿Deseas archivar a ${client.name}?\n\nEn una aplicación real, esto movería el registro a un almacenamiento de archivo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          onPress: () => {
            Alert.alert('Éxito', 'Cliente archivado correctamente');
          },
        },
      ]
    );
  };

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin visita';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Clientes Cerrados',
          headerStyle: {
            backgroundColor: '#10b981',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }} 
      />
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

        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {filteredClients.length} de {closedClients.length} clientes
          </Text>
          <View style={styles.statsBarActions}>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
              <Download color="#10b981" size={18} />
              <Text style={styles.exportButtonText}>Exportar</Text>
            </TouchableOpacity>
          </View>
        </View>

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
                <View style={styles.infoRow}>
                  <Clock color="#64748b" size={16} />
                  <Text style={styles.infoText}>Última visita: {formatDate(client.lastVisit)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <UserCircle color="#64748b" size={16} />
                  <Text style={styles.infoText}>Asignado: {client.assignedTo}</Text>
                </View>
              </View>

              <View style={styles.clientCardFooter}>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/edit-client/${client.id}`);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reopenButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleReopenClient(client);
                    }}
                  >
                    <Text style={styles.reopenButtonText}>Reabrir</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.archiveButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleArchive(client);
                    }}
                  >
                    <Archive color="#6366f1" size={16} />
                    <Text style={styles.archiveButtonText}>Archivar</Text>
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
              <Text style={styles.emptyText}>No se encontraron clientes cerrados</Text>
              <Text style={styles.emptySubtext}>
                {hasActiveFilters ? 'Prueba ajustando los filtros' : 'Aún no hay clientes cerrados'}
              </Text>
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

                <Text style={styles.filterSectionTitle}>Vendedor Asignado</Text>
                <View style={styles.filterOptionsGrid}>
                  <TouchableOpacity
                    style={[styles.filterOption, selectedSalesRep === 'all' && styles.filterOptionActive]}
                    onPress={() => setSelectedSalesRep('all')}
                  >
                    <Text style={[styles.filterOptionText, selectedSalesRep === 'all' && styles.filterOptionTextActive]}>
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {SALES_REPS.map(rep => (
                    <TouchableOpacity
                      key={rep.id}
                      style={[styles.filterOption, selectedSalesRep === rep.name && styles.filterOptionActive]}
                      onPress={() => setSelectedSalesRep(rep.name)}
                    >
                      <Text style={[styles.filterOptionText, selectedSalesRep === rep.name && styles.filterOptionTextActive]}>
                        {rep.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.filterSectionTitle}>Rango de Fechas (Última Visita)</Text>
                <View style={styles.dateRangeContainer}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Desde</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      value={dateRangeStart}
                      onChangeText={setDateRangeStart}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Hasta</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      value={dateRangeEnd}
                      onChangeText={setDateRangeEnd}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#10b981',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  statsBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
  },
  exportButtonText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#d1fae5',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#065f46',
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
  clientCardFooter: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
  },
  reopenButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
  },
  reopenButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#b45309',
  },
  archiveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  archiveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
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
    backgroundColor: '#10b981',
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
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  filterOptionTextActive: {
    color: '#10b981',
    fontWeight: '600' as const,
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateInputContainer: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  dateInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
