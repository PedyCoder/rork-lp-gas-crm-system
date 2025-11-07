import { useCRM } from '@/contexts/CRMContext';
import { Client, ClientStatus, ClientType } from '@/types/client';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, Filter, ArrowUpDown, Download, ChevronRight, X, MapPin, Phone, Mail, User, CreditCard } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { AREAS, SALES_REPS } from '@/constants/mockData';

import { downloadExcel } from '@/utils/downloadExcel';
import { useAuth } from '@/contexts/AuthContext';

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

type SortField = 'name' | 'createdAt' | 'lastVisit' | 'area';
type SortOrder = 'asc' | 'desc';

export default function SearchScreen() {
  const router = useRouter();
  const { clients, updateClient, isLoading } = useCRM();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedType, setSelectedType] = useState<ClientType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ClientStatus | 'all'>('all');
  const [selectedArea, setSelectedArea] = useState<string | 'all'>('all');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 10;

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.assignedTo.toLowerCase().includes(query)
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

    if (selectedSalesRep !== 'all') {
      filtered = filtered.filter(c => c.assignedTo === selectedSalesRep);
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastVisit':
          const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
          const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'area':
          comparison = a.area.localeCompare(b.area);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [clients, searchQuery, selectedType, selectedStatus, selectedArea, selectedSalesRep, sortField, sortOrder]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedClients.slice(start, end);
  }, [filteredAndSortedClients, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedArea('all');
    setSelectedSalesRep('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    selectedType !== 'all' || 
    selectedStatus !== 'all' || 
    selectedArea !== 'all' || 
    selectedSalesRep !== 'all' ||
    searchQuery.length > 0;

  const exportResults = async () => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_RORK_API_BASE_URL}/api/trpc/clients.exportExcel?input=${encodeURIComponent(JSON.stringify({
        clients: filteredAndSortedClients,
        exportDate: new Date().toISOString(),
        exportedBy: user?.name || 'Usuario',
        filters: {
          type: selectedType !== 'all' ? selectedType : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          area: selectedArea !== 'all' ? selectedArea : undefined,
          salesRep: selectedSalesRep !== 'all' ? selectedSalesRep : undefined,
        },
      }))}`);

      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const data = await response.json();
      const exportData = data.result.data;

      await downloadExcel(exportData.excel, exportData.filename);
      
      Alert.alert(
        'Éxito', 
        `Se exportaron ${filteredAndSortedClients.length} clientes correctamente`
      );
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'No se pudo exportar los resultados');
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusChange = async (clientId: string, newStatus: ClientStatus) => {
    try {
      await updateClient(clientId, { status: newStatus });
      Alert.alert('Éxito', 'Estado actualizado correctamente');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const showStatusMenu = (client: Client) => {
    const statusOptions: ClientStatus[] = ['new', 'in_progress', 'closed'];
    const buttons = statusOptions
      .filter(s => s !== client.status)
      .map(status => ({
        text: STATUS_LABELS[status],
        onPress: () => handleStatusChange(client.id, status),
      }));

    Alert.alert(
      'Cambiar Estado',
      `Estado actual: ${STATUS_LABELS[client.status]}`,
      [
        ...buttons,
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchIcon color="#64748b" size={20} />
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, hasActiveFilters && styles.iconButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Filter color={hasActiveFilters ? '#fff' : '#64748b'} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSort(true)}
          >
            <ArrowUpDown color="#64748b" size={20} />
          </TouchableOpacity>
          {filteredAndSortedClients.length > 0 && (
            <TouchableOpacity
              style={[styles.iconButton, isExporting && styles.iconButtonDisabled]}
              onPress={exportResults}
              disabled={isExporting}
            >
              <Download color={isExporting ? "#94a3b8" : "#64748b"} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            {`${filteredAndSortedClients.length} resultado${filteredAndSortedClients.length !== 1 ? 's' : ''}`}
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Limpiar Todo</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sortInfoContainer}>
        <Text style={styles.sortInfoText}>
          Ordenado por: {sortField === 'name' ? 'Nombre' : sortField === 'createdAt' ? 'Fecha de Creación' : sortField === 'lastVisit' ? 'Última Visita' : 'Área'} ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
        </Text>
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
              {client.credit && (
                <View style={styles.infoRow}>
                  <CreditCard color="#10b981" size={16} />
                  <Text style={styles.creditInfoText}>
                    Crédito: {client.creditDays} días
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <MapPin color="#64748b" size={16} />
                <Text style={styles.infoText}>{client.area}</Text>
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
                <User color="#64748b" size={16} />
                <Text style={styles.infoText}>{client.assignedTo}</Text>
              </View>
            </View>

            <View style={styles.clientCardFooter}>
              <Text style={styles.lastVisitText}>
                Última visita: {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'N/A'}
              </Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/edit-client/${client.id}`);
                  }}
                >
                  <Text style={styles.quickActionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButtonStatus}
                  onPress={(e) => {
                    e.stopPropagation();
                    showStatusMenu(client);
                  }}
                >
                  <Text style={styles.quickActionTextStatus}>Estado</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {paginatedClients.length === 0 && (
          <View style={styles.emptyContainer}>
            <SearchIcon color="#cbd5e1" size={64} />
            <Text style={styles.emptyTitle}>No se encontraron resultados</Text>
            <Text style={styles.emptyText}>
              Intenta ajustar tus filtros o búsqueda
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                <Text style={styles.emptyButtonText}>Limpiar Filtros</Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.modalTitle}>Filtros de Búsqueda</Text>
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
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showSort}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSort(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSort(false)}>
          <Pressable style={styles.modalContentSmall} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ordenar Por</Text>
              <TouchableOpacity onPress={() => setShowSort(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptions}>
              {[
                { field: 'name' as SortField, label: 'Nombre' },
                { field: 'createdAt' as SortField, label: 'Fecha de Creación' },
                { field: 'lastVisit' as SortField, label: 'Última Visita' },
                { field: 'area' as SortField, label: 'Área' },
              ].map(option => (
                <TouchableOpacity
                  key={option.field}
                  style={styles.sortOption}
                  onPress={() => {
                    if (sortField === option.field) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField(option.field);
                      setSortOrder('asc');
                    }
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortField === option.field && styles.sortOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {sortField === option.field && (
                    <Text style={styles.sortOrderText}>
                      {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => setShowSort(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#2563eb',
  },
  iconButtonDisabled: {
    backgroundColor: '#e2e8f0',
    opacity: 0.6,
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
    fontWeight: '600' as const,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600' as const,
  },
  sortInfoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sortInfoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
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
  creditInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#10b981',
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
  lastVisitText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#475569',
  },
  quickActionButtonStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
  },
  quickActionTextStatus: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
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
  modalContentSmall: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
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
  sortOptions: {
    gap: 12,
    marginBottom: 24,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  sortOptionTextActive: {
    color: '#2563eb',
    fontWeight: '600' as const,
  },
  sortOrderText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#2563eb',
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
