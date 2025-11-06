import { useCRM } from '@/contexts/CRMContext';
import { ClientType } from '@/types/client';
import { useRouter } from 'expo-router';
import { Search, Filter, MapPin, Phone, ChevronRight, X, Calendar, UserCircle, Edit, Clock } from 'lucide-react-native';
import React, { useState, useMemo, useCallback } from 'react';
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

interface VisitWithClient {
  id: string;
  clientId: string;
  clientName: string;
  clientType: ClientType;
  clientArea: string;
  date: string;
  notes: string;
  createdBy: string;
}

export default function MonthlyVisitsScreen() {
  const router = useRouter();
  const { clients, allVisitsFromHistory, addActivityToClient } = useCRM();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<ClientType | 'all'>('all');
  const [selectedArea, setSelectedArea] = useState<string | 'all'>('all');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string | 'all'>('all');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithClient | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpVisit, setFollowUpVisit] = useState<VisitWithClient | null>(null);
  const [scheduleFollowUp, setScheduleFollowUp] = useState(true);
  const [followUpDays, setFollowUpDays] = useState('7');

  const monthlyVisits = useMemo((): VisitWithClient[] => {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const visitsThisMonth = allVisitsFromHistory.filter(v => {
      const visitDate = new Date(v.date);
      return visitDate >= firstDayThisMonth && visitDate <= lastDayThisMonth;
    });

    return visitsThisMonth.map(visit => {
      const client = clients.find(c => c.id === visit.clientId);
      return {
        id: visit.id,
        clientId: visit.clientId,
        clientName: visit.clientName,
        clientType: client?.type || 'residential',
        clientArea: client?.area || '',
        date: visit.date,
        notes: visit.notes,
        createdBy: visit.createdBy,
      };
    });
  }, [allVisitsFromHistory, clients]);

  const filteredVisits = useMemo(() => {
    let filtered = monthlyVisits;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.clientName.toLowerCase().includes(query) ||
        v.notes.toLowerCase().includes(query) ||
        v.createdBy.toLowerCase().includes(query)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(v => v.clientType === selectedType);
    }

    if (selectedArea !== 'all') {
      filtered = filtered.filter(v => v.clientArea === selectedArea);
    }

    if (selectedSalesRep !== 'all') {
      filtered = filtered.filter(v => v.createdBy === selectedSalesRep);
    }

    if (dateRangeStart) {
      const startDate = new Date(dateRangeStart);
      filtered = filtered.filter(v => new Date(v.date) >= startDate);
    }

    if (dateRangeEnd) {
      const endDate = new Date(dateRangeEnd);
      filtered = filtered.filter(v => new Date(v.date) <= endDate);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthlyVisits, searchQuery, selectedType, selectedArea, selectedSalesRep, dateRangeStart, dateRangeEnd]);

  const paginatedVisits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredVisits.slice(start, end);
  }, [filteredVisits, currentPage]);

  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);

  const clearFilters = useCallback(() => {
    setSelectedType('all');
    setSelectedArea('all');
    setSelectedSalesRep('all');
    setDateRangeStart('');
    setDateRangeEnd('');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return selectedType !== 'all' || selectedArea !== 'all' || selectedSalesRep !== 'all' || dateRangeStart || dateRangeEnd;
  }, [selectedType, selectedArea, selectedSalesRep, dateRangeStart, dateRangeEnd]);

  const openEditModal = useCallback((visit: VisitWithClient) => {
    setSelectedVisit(visit);
    setEditNotes(visit.notes);
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedVisit) return;
    
    if (!editNotes.trim()) {
      Alert.alert('Error', 'Por favor ingrese notas de la visita');
      return;
    }

    Alert.alert('Nota', 'La edición de visitas históricas requiere actualizar el historial del cliente directamente');
    setShowEditModal(false);
  }, [selectedVisit, editNotes]);

  const openFollowUpModal = useCallback((visit: VisitWithClient) => {
    setFollowUpVisit(visit);
    setScheduleFollowUp(true);
    setFollowUpDays('7');
    setShowFollowUpModal(true);
  }, []);

  const handleScheduleFollowUp = useCallback(async () => {
    if (!followUpVisit) return;
    
    const daysNum = parseInt(followUpDays);
    if (isNaN(daysNum) || daysNum < 1) {
      Alert.alert('Error', 'Por favor ingrese un número válido de días');
      return;
    }

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysNum);

    const activity = {
      type: 'follow_up' as const,
      date: new Date().toISOString(),
      notes: `Seguimiento programado desde visita del ${new Date(followUpVisit.date).toLocaleDateString('es-ES')}`,
      createdBy: followUpVisit.createdBy,
      nextFollowUpDate: followUpDate.toISOString(),
    };

    await addActivityToClient(followUpVisit.clientId, activity);
    
    setShowFollowUpModal(false);
    setFollowUpVisit(null);
    
    Alert.alert('Éxito', `Seguimiento programado para dentro de ${daysNum} días`);
  }, [followUpVisit, followUpDays, addActivityToClient]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Visitas del Mes',
          headerStyle: {
            backgroundColor: '#8b5cf6',
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
              placeholder="Buscar visitas..."
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
            {filteredVisits.length} de {monthlyVisits.length} visitas
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {paginatedVisits.map(visit => (
            <TouchableOpacity
              key={visit.id}
              style={styles.visitCard}
              onPress={() => router.push(`/client/${visit.clientId}`)}
              activeOpacity={0.7}
            >
              <View style={styles.visitCardHeader}>
                <View style={styles.visitCardHeaderLeft}>
                  <Text style={styles.clientName}>{visit.clientName}</Text>
                  <View style={styles.badgeContainer}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{CLIENT_TYPE_LABELS[visit.clientType]}</Text>
                    </View>
                    <View style={styles.areaBadge}>
                      <MapPin color="#475569" size={12} />
                      <Text style={styles.areaBadgeText}>{visit.clientArea}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight color="#94a3b8" size={20} />
              </View>

              <View style={styles.visitInfo}>
                <View style={styles.infoRow}>
                  <Calendar color="#64748b" size={16} />
                  <Text style={styles.infoText}>{formatDate(visit.date)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <UserCircle color="#64748b" size={16} />
                  <Text style={styles.infoText}>Visitado por: {visit.createdBy}</Text>
                </View>
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notas:</Text>
                  <Text style={styles.notesText} numberOfLines={2}>{visit.notes}</Text>
                </View>
              </View>

              <View style={styles.visitCardFooter}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/client/${visit.clientId}`);
                  }}
                >
                  <Text style={styles.actionButtonText}>Ver Detalles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    openEditModal(visit);
                  }}
                >
                  <Edit color="#2563eb" size={16} />
                  <Text style={styles.editButtonText}>Editar Notas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.followUpButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    openFollowUpModal(visit);
                  }}
                >
                  <Clock color="#059669" size={16} />
                  <Text style={styles.followUpButtonText}>Programar Seguimiento</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {paginatedVisits.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se encontraron visitas</Text>
              <Text style={styles.emptySubtext}>
                {hasActiveFilters ? 'Prueba ajustando los filtros' : 'No hay visitas registradas este mes'}
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
          visible={showEditModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Notas de Visita</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              {selectedVisit && (
                <View style={styles.clientInfoBanner}>
                  <Text style={styles.clientInfoName}>{selectedVisit.clientName}</Text>
                  <Text style={styles.clientInfoDetails}>
                    {formatDate(selectedVisit.date)} - {selectedVisit.createdBy}
                  </Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Notas de la Visita</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Describe los detalles de la visita..."
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.clearButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton} 
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.applyButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showFollowUpModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowFollowUpModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowFollowUpModal(false)}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Programar Seguimiento</Text>
                <TouchableOpacity onPress={() => setShowFollowUpModal(false)}>
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              {followUpVisit && (
                <View style={styles.clientInfoBanner}>
                  <Text style={styles.clientInfoName}>{followUpVisit.clientName}</Text>
                  <Text style={styles.clientInfoDetails}>
                    Última visita: {formatDate(followUpVisit.date)}
                  </Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Días hasta el seguimiento</Text>
              <View style={styles.daysOptionsContainer}>
                {['3', '7', '14', '30'].map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayOption,
                      followUpDays === days && styles.dayOptionActive
                    ]}
                    onPress={() => setFollowUpDays(days)}
                  >
                    <Text style={[
                      styles.dayOptionText,
                      followUpDays === days && styles.dayOptionTextActive
                    ]}>
                      {days} días
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.customDaysInput}
                placeholder="O ingresa un número personalizado"
                value={followUpDays}
                onChangeText={setFollowUpDays}
                keyboardType="number-pad"
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => setShowFollowUpModal(false)}
                >
                  <Text style={styles.clearButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton} 
                  onPress={handleScheduleFollowUp}
                >
                  <Text style={styles.applyButtonText}>Programar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

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

                <Text style={styles.filterSectionTitle}>Municipio</Text>
                <View style={styles.filterOptionsGrid}>
                  <TouchableOpacity
                    style={[styles.filterOption, selectedArea === 'all' && styles.filterOptionActive]}
                    onPress={() => setSelectedArea('all')}
                  >
                    <Text style={[styles.filterOptionText, selectedArea === 'all' && styles.filterOptionTextActive]}>
                      Todos
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

                <Text style={styles.filterSectionTitle}>Vendedor</Text>
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

                <Text style={styles.filterSectionTitle}>Rango de Fechas</Text>
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
    backgroundColor: '#8b5cf6',
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
  clearFiltersText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600' as const,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  visitCard: {
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
  visitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visitCardHeaderLeft: {
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
    backgroundColor: '#e0e7ff',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#4338ca',
  },
  areaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  areaBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#475569',
  },
  visitInfo: {
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
  notesContainer: {
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  visitCardFooter: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
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
  editButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
  },
  followUpButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  followUpButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#059669',
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
    backgroundColor: '#8b5cf6',
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
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  filterOptionTextActive: {
    color: '#8b5cf6',
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
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  clientInfoBanner: {
    backgroundColor: '#ede9fe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  clientInfoName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  clientInfoDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 120,
    marginBottom: 20,
  },
  daysOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  dayOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  dayOptionActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6',
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  dayOptionTextActive: {
    color: '#8b5cf6',
    fontWeight: '600' as const,
  },
  customDaysInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
