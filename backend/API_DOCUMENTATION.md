# CRM Backend API Documentation

Complete tRPC API documentation for the PostgreSQL-backed CRM system.

## Base URL

All tRPC endpoints are available at: `/api/trpc/`

## Authentication

Currently using basic authentication with email/password. Users are authenticated via the `auth.login` endpoint.

---

## Database Management

### `db.init`

Initialize the database schema and create tables.

**Type**: Mutation

**Input**: None

**Response**:
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
}
```

**Example**:
```typescript
const result = await trpcClient.db.init.mutate();
```

### `db.checkConnection`

Check database connection status.

**Type**: Query

**Input**: None

**Response**:
```typescript
{
  connected: boolean;
  message: string;
}
```

---

## Authentication

### `auth.login`

Authenticate a user and create a session.

**Type**: Mutation

**Input**:
```typescript
{
  email: string;
  password: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'sales';
    isActive: boolean;
  };
  error?: string;
}
```

**Example**:
```typescript
const result = await trpcClient.auth.login.mutate({
  email: 'manager@lpgas.com',
  password: 'manager123',
});
```

---

## Users (PostgreSQL)

### `pgUsers.list`

Get all users from PostgreSQL database.

**Type**: Query

**Input**: None

**Response**:
```typescript
Array<{
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  loginCount: number;
}>
```

### `pgUsers.create`

Create a new user.

**Type**: Mutation

**Input**:
```typescript
{
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'sales';
  createdBy: string; // User ID of creator
}
```

**Response**:
```typescript
{
  success: boolean;
  userId?: string;
  error?: string;
}
```

### `pgUsers.update`

Update an existing user.

**Type**: Mutation

**Input**:
```typescript
{
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'sales';
  isActive?: boolean;
  password?: string;
  updatedBy: string; // User ID of updater
}
```

**Response**:
```typescript
{
  success: boolean;
  error?: string;
}
```

---

## Clients (PostgreSQL)

### `pgClients.list`

Get clients with role-based filtering.

**Type**: Query

**Input**:
```typescript
{
  userId?: string;
  userRole?: 'admin' | 'sales';
  status?: 'new' | 'in_progress' | 'closed';
  type?: 'residential' | 'restaurant' | 'commercial' | 'food_truck' | 'forklift';
  assignedTo?: string;
  search?: string;
}
```

**Response**:
```typescript
Array<{
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
  createdAt: string;
  updatedAt: string;
  activityHistory: Array<{
    id: string;
    type: 'visit' | 'follow_up' | 'note';
    date: string;
    notes: string;
    nextFollowUpDate?: string;
    createdBy: string;
  }>;
}>
```

**Example**:
```typescript
// Get all clients for admin
const clients = await trpc.pgClients.list.useQuery({
  userRole: 'admin',
});

// Get assigned clients for sales rep
const myClients = await trpc.pgClients.list.useQuery({
  userId: 'user123',
  userRole: 'sales',
});
```

### `pgClients.create`

Create a new client.

**Type**: Mutation

**Input**:
```typescript
{
  name: string;
  type: 'residential' | 'restaurant' | 'commercial' | 'food_truck' | 'forklift';
  address: string;
  phone: string;
  email: string;
  status: 'new' | 'in_progress' | 'closed';
  notes: string;
  assignedTo: string; // User ID
  area: string;
  createdBy: string; // User ID
}
```

### `pgClients.update`

Update an existing client.

**Type**: Mutation

**Input**:
```typescript
{
  id: string;
  name?: string;
  type?: ClientType;
  address?: string;
  phone?: string;
  email?: string;
  status?: ClientStatus;
  notes?: string;
  assignedTo?: string;
  area?: string;
  lastVisit?: string | null;
  updatedBy: string; // User ID
}
```

### `pgClients.delete`

Delete a client (cascades to visits and attachments).

**Type**: Mutation

**Input**:
```typescript
{
  id: string;
  deletedBy: string; // User ID
}
```

---

## Visits (PostgreSQL)

### `pgVisits.create`

Create a new visit/activity entry.

**Type**: Mutation

**Input**:
```typescript
{
  clientId: string;
  type: 'visit' | 'follow_up' | 'note';
  date: string; // ISO 8601 date
  notes: string;
  nextFollowUpDate?: string;
  createdBy: string; // User ID
}
```

**Response**:
```typescript
{
  success: boolean;
  visitId?: string;
  error?: string;
}
```

**Note**: When type is 'visit', the client's `lastVisit` field is automatically updated.

### `pgVisits.list`

Get visits with filtering options.

**Type**: Query

**Input**:
```typescript
{
  clientId?: string;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  type?: 'visit' | 'follow_up' | 'note';
}
```

**Response**:
```typescript
Array<{
  id: string;
  clientId: string;
  clientName: string;
  type: 'visit' | 'follow_up' | 'note';
  date: string;
  notes: string;
  nextFollowUpDate: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}>
```

---

## Exports (PostgreSQL)

### `pgExports.create`

Create and export data to Excel file.

**Type**: Mutation

**Input**:
```typescript
{
  exportType: 'clients' | 'visits' | 'full';
  filters?: any; // Optional filter criteria
  exportedBy: string; // User ID
}
```

**Response**:
```typescript
{
  success: boolean;
  exportId?: string;
  filename?: string;
  filepath?: string;
  recordCount?: number;
  error?: string;
}
```

**Example**:
```typescript
const result = await trpcClient.pgExports.create.mutate({
  exportType: 'clients',
  filters: { status: 'in_progress' },
  exportedBy: currentUser.id,
});
```

---

## Audit Logs (PostgreSQL)

### `pgAudit.list`

Get audit log entries with filtering.

**Type**: Query

**Input**:
```typescript
{
  userId?: string;
  entityType?: 'user' | 'client' | 'visit' | 'attachment' | 'export' | 'auth';
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number; // Default: 100
  offset?: number; // Default: 0
}
```

**Response**:
```typescript
Array<{
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: any; // JSON object
  newValues: any; // JSON object
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}>
```

**Example**:
```typescript
// Get recent client changes
const logs = await trpc.pgAudit.list.useQuery({
  entityType: 'client',
  limit: 50,
});

// Get specific user's actions
const userLogs = await trpc.pgAudit.list.useQuery({
  userId: 'user123',
  startDate: '2025-01-01T00:00:00Z',
});
```

---

## Dashboard (PostgreSQL)

### `pgDashboard.stats`

Get dashboard statistics and KPIs.

**Type**: Query

**Input**:
```typescript
{
  userId?: string;
  userRole?: 'admin' | 'sales';
}
```

**Response**:
```typescript
{
  totalClients: number;
  clientsInProgress: number;
  closedClients: number;
  visitsThisMonth: number;
  visitsLastMonth: number;
  newClientsThisMonth: number;
  dailyVisits: Array<{
    date: string;
    count: number;
  }>;
  recentVisits: Array<{
    id: string;
    clientId: string;
    clientName: string;
    date: string;
    notes: string;
    createdBy: string;
  }>;
}
```

**Example**:
```typescript
// Get stats for admin (all data)
const stats = await trpc.pgDashboard.stats.useQuery({
  userRole: 'admin',
});

// Get stats for sales rep (assigned clients only)
const myStats = await trpc.pgDashboard.stats.useQuery({
  userId: currentUser.id,
  userRole: 'sales',
});
```

---

## Legacy Endpoints (File-based)

These endpoints still exist for backward compatibility but will use JSON file storage:

- `users.list`
- `users.create`
- `users.update`
- `users.authenticate`
- `clients.exportExcel`
- `clients.saveToStore`
- `clients.loadFromStore`

---

## Error Handling

All endpoints return structured error responses:

```typescript
{
  success: false,
  error: string
}
```

Common error scenarios:
- Database connection failures
- Validation errors (invalid input)
- Not found errors (invalid IDs)
- Permission errors (role-based access)

---

## Type Definitions

Full TypeScript types are available via the tRPC AppRouter:

```typescript
import type { AppRouter } from '@/backend/trpc/app-router';
```

---

## Testing

You can test endpoints using the tRPC client:

```typescript
import { trpcClient } from '@/lib/trpc';

// Test connection
const status = await trpcClient.db.checkConnection.query();
console.log('Database status:', status);

// Initialize database
const init = await trpcClient.db.init.mutate();
console.log('Initialization:', init);

// Login
const auth = await trpcClient.auth.login.mutate({
  email: 'manager@lpgas.com',
  password: 'manager123',
});
console.log('Auth result:', auth);
```
