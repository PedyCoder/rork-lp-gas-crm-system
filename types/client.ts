export type ClientType = 'residential' | 'restaurant' | 'commercial' | 'food_truck' | 'forklift';
export type ClientStatus = 'new' | 'in_progress' | 'closed';
export type UserRole = 'admin' | 'sales';

export interface ActivityHistoryEntry {
  id: string;
  type: 'visit' | 'follow_up' | 'note';
  date: string;
  notes: string;
  nextFollowUpDate?: string;
  createdBy: string;
}

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  address: string;
  phone: string;
  email: string;
  lastVisit: string | null;
  status: ClientStatus;
  notes: string;
  assignedTo: string;
  area: string;
  hasCredit: boolean;
  creditDays?: number;
  hasDiscount: boolean;
  discountAmount?: number;
  activityHistory?: ActivityHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  clientId: string;
  date: string;
  notes: string;
  createdBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin: string | null;
  loginCount: number;
}

export interface DashboardKPIs {
  totalClients: number;
  clientsInProgress: number;
  closedClients: number;
  visitsThisMonth: number;
  visitsLastMonth: number;
  newClientsThisMonth: number;
  dailyVisits: { date: string; count: number }[];
  recentVisits: Array<{
    id: string;
    clientId: string;
    clientName: string;
    date: string;
    notes: string;
    createdBy: string;
  }>;
}

export interface Notification {
  id: string;
  clientId: string;
  clientName: string;
  type: 'follow_up' | 'visit_scheduled';
  message: string;
  scheduledDate: string;
  isRead: boolean;
  createdAt: string;
}
