import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityHistoryEntry, Client, ClientStatus, ClientType, DashboardKPIs, Notification, Visit } from '@/types/client';
import { generateMockClients, SALES_REPS } from '@/constants/mockData';
import { useAuth } from './AuthContext';

const STORAGE_KEYS = {
  CLIENTS: '@crm_clients',
  VISITS: '@crm_visits',
  NOTIFICATIONS: '@crm_notifications',
};

export const [CRMProvider, useCRM] = createContextHook(() => {
  const { user, isManager, getEffectiveUserId } = useAuth();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, visitsData, notificationsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CLIENTS),
        AsyncStorage.getItem(STORAGE_KEYS.VISITS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
      ]);

      let currentClients: Client[];
      if (clientsData) {
        currentClients = JSON.parse(clientsData);
        setAllClients(currentClients);
      } else {
        currentClients = generateMockClients();
        setAllClients(currentClients);
        await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(currentClients));
      }

      if (visitsData) {
        setVisits(JSON.parse(visitsData));
      }

      if (notificationsData) {
        setNotifications(JSON.parse(notificationsData));
      } else {
        const sampleNotifications: Notification[] = [];
        const clientsWithFollowUps = currentClients.filter(
          (c: Client) => c.status === 'in_progress'
        ).slice(0, 3);

        clientsWithFollowUps.forEach((client: Client, index: number) => {
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() + index + 1);
          
          sampleNotifications.push({
            id: `notif-${Date.now()}-${index}`,
            clientId: client.id,
            clientName: client.name,
            type: 'follow_up',
            message: 'Requiere seguimiento para cerrar la venta',
            scheduledDate: scheduledDate.toISOString(),
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        });

        if (sampleNotifications.length > 0) {
          setNotifications(sampleNotifications);
          await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(sampleNotifications));
        }
      }
    } catch (error) {
      console.error('Error loading CRM data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveClients = useCallback(async (newClients: Client[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
      setAllClients(newClients);
    } catch (error) {
      console.error('Error saving clients:', error);
    }
  }, []);

  const clients = useMemo(() => {
    if (!user) return [];
    
    if (isManager) {
      const effectiveUserId = getEffectiveUserId();
      if (effectiveUserId) {
        const salesRep = SALES_REPS.find(rep => rep.id === effectiveUserId);
        if (salesRep) {
          return allClients.filter(c => c.assignedTo === salesRep.name);
        }
      }
      return allClients;
    }
    
    return allClients.filter(c => c.assignedTo === user.name);
  }, [allClients, user, isManager, getEffectiveUserId]);

  const addClient = useCallback(async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...allClients, newClient];
    await saveClients(updated);
    return newClient;
  }, [allClients, saveClients]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    const updated = allClients.map(c =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    await saveClients(updated);
  }, [allClients, saveClients]);

  const deleteClient = useCallback(async (id: string) => {
    const updated = allClients.filter(c => c.id !== id);
    await saveClients(updated);
  }, [allClients, saveClients]);

  const addVisit = useCallback(async (visit: Omit<Visit, 'id'>) => {
    const newVisit: Visit = {
      ...visit,
      id: `visit-${Date.now()}`,
    };
    const updated = [...visits, newVisit];
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(updated));
      setVisits(updated);
      
      await updateClient(visit.clientId, { lastVisit: visit.date });
    } catch (error) {
      console.error('Error adding visit:', error);
    }
  }, [visits, updateClient]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...notifications, newNotification];
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, [notifications]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [notifications]);

  const addActivityToClient = useCallback(async (
    clientId: string,
    activity: Omit<ActivityHistoryEntry, 'id'>
  ) => {
    const client = allClients.find(c => c.id === clientId);
    if (!client) {
      console.error('Client not found:', clientId);
      return;
    }

    const newActivity: ActivityHistoryEntry = {
      ...activity,
      id: `activity-${Date.now()}`,
    };

    const activityHistory = client.activityHistory || [];
    const updatedHistory = [...activityHistory, newActivity];

    await updateClient(clientId, {
      activityHistory: updatedHistory,
      lastVisit: activity.date,
    });

    if (activity.nextFollowUpDate) {
      await addNotification({
        clientId,
        clientName: client.name,
        type: 'follow_up',
        message: `Seguimiento programado: ${activity.notes}`,
        scheduledDate: activity.nextFollowUpDate,
      });
    }
  }, [allClients, updateClient, addNotification]);

  const getClientsByStatus = useCallback((status: ClientStatus) => {
    return clients.filter(c => c.status === status);
  }, [clients]);

  const getClientsByType = useCallback((type: ClientType) => {
    return clients.filter(c => c.type === type);
  }, [clients]);

  const getClientsByArea = useCallback((area: string) => {
    return clients.filter(c => c.area === area);
  }, [clients]);

  const getVisitsForClient = useCallback((clientId: string) => {
    return visits.filter(v => v.clientId === clientId);
  }, [visits]);

  const allVisitsFromHistory = useMemo(() => {
    const visitsList: Array<{
      id: string;
      clientId: string;
      clientName: string;
      date: string;
      notes: string;
      createdBy: string;
    }> = [];

    clients.forEach(client => {
      if (client.activityHistory) {
        client.activityHistory.forEach(activity => {
          if (activity.type === 'visit') {
            visitsList.push({
              id: activity.id,
              clientId: client.id,
              clientName: client.name,
              date: activity.date,
              notes: activity.notes,
              createdBy: activity.createdBy,
            });
          }
        });
      }
    });

    return visitsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clients]);

  const dashboardKPIs = useMemo((): DashboardKPIs => {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const visitsThisMonth = allVisitsFromHistory.filter(v => {
      const visitDate = new Date(v.date);
      return visitDate >= firstDayThisMonth;
    });

    const visitsLastMonth = allVisitsFromHistory.filter(v => {
      const visitDate = new Date(v.date);
      return visitDate >= firstDayLastMonth && visitDate <= lastDayLastMonth;
    });

    const newClientsThisMonth = clients.filter(c => {
      const createdDate = new Date(c.createdAt);
      return createdDate >= firstDayThisMonth;
    });

    const dailyVisitsMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyVisitsMap.set(dateStr, 0);
    }

    visitsThisMonth.forEach(visit => {
      const dateStr = visit.date.split('T')[0];
      if (dailyVisitsMap.has(dateStr)) {
        dailyVisitsMap.set(dateStr, (dailyVisitsMap.get(dateStr) || 0) + 1);
      }
    });

    const dailyVisits = Array.from(dailyVisitsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse();

    const recentVisits = allVisitsFromHistory.slice(0, 5);

    return {
      totalClients: clients.length,
      clientsInProgress: clients.filter(c => c.status === 'in_progress').length,
      closedClients: clients.filter(c => c.status === 'closed').length,
      visitsThisMonth: visitsThisMonth.length,
      visitsLastMonth: visitsLastMonth.length,
      newClientsThisMonth: newClientsThisMonth.length,
      dailyVisits,
      recentVisits,
    };
  }, [clients, allVisitsFromHistory]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  return {
    clients,
    visits,
    notifications,
    unreadNotifications,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    addVisit,
    addNotification,
    markNotificationAsRead,
    addActivityToClient,
    getClientsByStatus,
    getClientsByType,
    getClientsByArea,
    getVisitsForClient,
    dashboardKPIs,
    allVisitsFromHistory,
  };
});
