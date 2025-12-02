import { useCRM } from '@/contexts/CRMContext';
import { ClientType, ClientStatus } from '@/types/client';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { AREAS } from '@/constants/mockData';

const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: 'residential', label: 'Residencial' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'forklift', label: 'Montacargas' },
];

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'new', label: 'Nuevo' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'closed', label: 'Cerrado' },
];

export default function AddClientScreen() {
  const router = useRouter();
  const { addClient } = useCRM();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<ClientType>('residential');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<ClientStatus>('new');
  const [notes, setNotes] = useState('');
  const [area, setArea] = useState(AREAS[0]);
  const [hasCredit, setHasCredit] = useState(false);
  const [creditDays, setCreditDays] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'La dirección es requerida');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'El teléfono es requerido');
      return;
    }

    try {
      await addClient({
        name: name.trim(),
        type,
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        lastVisit: null,
        status,
        notes: notes.trim(),
        area,
        hasCredit,
        creditDays: hasCredit && creditDays ? parseInt(creditDays, 10) : undefined,
        hasDiscount,
        discountAmount: hasDiscount && discountAmount ? parseFloat(discountAmount) : undefined,
      });

      Alert.alert('Éxito', 'Cliente agregado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo agregar el cliente');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Información Básica</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre del Cliente *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Restaurante El Buen Sabor"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de Cliente *</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowTypeModal(true)}
          >
            <Text style={styles.selectInputText}>
              {CLIENT_TYPE_OPTIONS.find(o => o.value === type)?.label}
            </Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Dirección *</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Calle, número, colonia"
            placeholderTextColor="#94a3b8"
            multiline
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+52 555 1234 5678"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
          </View>

          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Gestión</Text>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <Text style={styles.label}>Estado *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.selectInputText}>
                {STATUS_OPTIONS.find(o => o.value === status)?.label}
              </Text>
              <ChevronDown color="#64748b" size={20} />
            </TouchableOpacity>
          </View>

          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <Text style={styles.label}>Área *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowAreaModal(true)}
            >
              <Text style={styles.selectInputText}>{area}</Text>
              <ChevronDown color="#64748b" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Condiciones Comerciales</Text>

        <View style={styles.formGroup}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.label}>Crédito</Text>
              <Text style={styles.helperText}>¿El cliente tiene crédito?</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, hasCredit && styles.toggleActive]}
              onPress={() => {
                setHasCredit(!hasCredit);
                if (hasCredit) setCreditDays('');
              }}
            >
              <Text style={[styles.toggleText, hasCredit && styles.toggleTextActive]}>
                {hasCredit ? 'Sí' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>
          {hasCredit && (
            <View style={styles.conditionalField}>
              <Text style={styles.label}>Días de Crédito</Text>
              <TextInput
                style={styles.input}
                value={creditDays}
                onChangeText={setCreditDays}
                placeholder="Ej: 30"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.label}>Descuento</Text>
              <Text style={styles.helperText}>¿El cliente tiene descuento?</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, hasDiscount && styles.toggleActive]}
              onPress={() => {
                setHasDiscount(!hasDiscount);
                if (hasDiscount) setDiscountAmount('');
              }}
            >
              <Text style={[styles.toggleText, hasDiscount && styles.toggleTextActive]}>
                {hasDiscount ? 'Sí' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>
          {hasDiscount && (
            <View style={styles.conditionalField}>
              <Text style={styles.label}>Descuento (MXN)</Text>
              <TextInput
                style={styles.input}
                value={discountAmount}
                onChangeText={setDiscountAmount}
                placeholder="Ej: 150.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Información adicional sobre el cliente..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Agregar Cliente</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showTypeModal} animationType="slide" transparent onRequestClose={() => setShowTypeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Tipo</Text>
            {CLIENT_TYPE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.modalOption, type === option.value && styles.modalOptionSelected]}
                onPress={() => {
                  setType(option.value);
                  setShowTypeModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, type === option.value && styles.modalOptionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showStatusModal} animationType="slide" transparent onRequestClose={() => setShowStatusModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowStatusModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Estado</Text>
            {STATUS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.modalOption, status === option.value && styles.modalOptionSelected]}
                onPress={() => {
                  setStatus(option.value);
                  setShowStatusModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, status === option.value && styles.modalOptionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showAreaModal} animationType="slide" transparent onRequestClose={() => setShowAreaModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAreaModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Área</Text>
            {AREAS.map(areaOption => (
              <TouchableOpacity
                key={areaOption}
                style={[styles.modalOption, area === areaOption && styles.modalOptionSelected]}
                onPress={() => {
                  setArea(areaOption);
                  setShowAreaModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, area === areaOption && styles.modalOptionTextSelected]}>
                  {areaOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectInputText: {
    fontSize: 16,
    color: '#0f172a',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#475569',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
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
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  modalOptionSelected: {
    backgroundColor: '#dbeafe',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#475569',
  },
  modalOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600' as const,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  toggle: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#fff',
  },
  conditionalField: {
    marginTop: 12,
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
});
