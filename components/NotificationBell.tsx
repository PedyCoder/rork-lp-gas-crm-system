import { useCRM } from '@/contexts/CRMContext';
import { Bell } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function NotificationBell() {
  const router = useRouter();
  const { unreadNotifications, markNotificationAsRead } = useCRM();
  const [showModal, setShowModal] = useState(false);

  const handleNotificationPress = (notificationId: string, clientId: string) => {
    markNotificationAsRead(notificationId);
    setShowModal(false);
    router.push(`/client/${clientId}` as any);
  };

  return (
    <>
      <TouchableOpacity style={styles.bellButton} onPress={() => setShowModal(true)}>
        <Bell color="#475569" size={24} />
        {unreadNotifications.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadNotifications.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Notificaciones</Text>
            <ScrollView style={styles.notificationsList}>
              {unreadNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay notificaciones pendientes</Text>
                </View>
              ) : (
                unreadNotifications.map(notification => (
                  <TouchableOpacity
                    key={notification.id}
                    style={styles.notificationItem}
                    onPress={() => handleNotificationPress(notification.id, notification.clientId)}
                  >
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationClient}>{notification.clientName}</Text>
                      <Text style={styles.notificationDate}>
                        {new Date(notification.scheduledDate).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  notificationsList: {
    maxHeight: 400,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  notificationItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationClient: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    flex: 1,
  },
  notificationDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
