# Migration Guide: JSON Files to PostgreSQL

This guide explains how to migrate from the existing JSON file-based storage to the new PostgreSQL database.

## Overview

The CRM application now supports both storage methods:
- **Legacy**: JSON files in `backend/store/`
- **New**: PostgreSQL database with full features

## Migration Steps

### Step 1: Set Up PostgreSQL

1. Install PostgreSQL 12+:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql

# Windows
# Download installer from postgresql.org
```

2. Create database:
```bash
createdb crm_db
```

3. Configure environment variables in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### Step 2: Initialize Database Schema

Run the initialization procedure:

```typescript
import { trpcClient } from '@/lib/trpc';

const result = await trpcClient.db.init.mutate();
console.log('Database initialized:', result);
```

Or run SQL directly:
```bash
psql -U postgres -d crm_db -f backend/db/schema.sql
```

### Step 3: Migrate Existing Data

Create a migration script to transfer data from JSON to PostgreSQL:

```typescript
import { trpcClient } from '@/lib/trpc';
import { readFile } from 'fs/promises';

async function migrateData() {
  // Load existing JSON data
  const usersJson = await readFile('backend/store/users.json', 'utf-8');
  const users = JSON.parse(usersJson);
  
  // Migrate users
  for (const user of users) {
    await trpcClient.pgUsers.create.mutate({
      name: user.name,
      email: user.email,
      password: user.password, // Note: Should hash in production
      role: user.role,
      createdBy: 'migration-script',
    });
  }
  
  // Load and migrate clients
  const clientsData = await trpcClient.clients.loadFromStore.query();
  
  if (clientsData.success) {
    for (const client of clientsData.clients) {
      // Create client
      const result = await trpcClient.pgClients.create.mutate({
        name: client.name,
        type: client.type,
        address: client.address,
        phone: client.phone,
        email: client.email,
        status: client.status,
        notes: client.notes,
        assignedTo: client.assignedTo,
        area: client.area,
        createdBy: 'migration-script',
      });
      
      // Migrate activity history as visits
      if (client.activityHistory && result.success) {
        for (const activity of client.activityHistory) {
          await trpcClient.pgVisits.create.mutate({
            clientId: result.clientId!,
            type: activity.type,
            date: activity.date,
            notes: activity.notes,
            nextFollowUpDate: activity.nextFollowUpDate,
            createdBy: activity.createdBy,
          });
        }
      }
    }
  }
  
  console.log('Migration complete!');
}

migrateData().catch(console.error);
```

### Step 4: Update Application Code

Replace old tRPC calls with new PostgreSQL endpoints:

#### Before (JSON-based):
```typescript
// Get users
const users = await trpc.users.list.useQuery();

// Create user
await trpc.users.create.useMutation();

// Get clients
const clients = await trpc.clients.loadFromStore.useQuery();
```

#### After (PostgreSQL):
```typescript
// Get users
const users = await trpc.pgUsers.list.useQuery();

// Create user
await trpc.pgUsers.create.useMutation();

// Get clients
const clients = await trpc.pgClients.list.useQuery({
  userId: currentUser.id,
  userRole: currentUser.role,
});
```

### Step 5: Update Context/State Management

Update your context providers to use PostgreSQL endpoints:

```typescript
// contexts/CRMContext.tsx
export const [CRMContext, useCRM] = createContextHook(() => {
  const { data: currentUser } = useAuth();
  
  // Use pgClients instead of file-based storage
  const clientsQuery = trpc.pgClients.list.useQuery({
    userId: currentUser?.id,
    userRole: currentUser?.role,
  });
  
  const createClientMutation = trpc.pgClients.create.useMutation({
    onSuccess: () => {
      clientsQuery.refetch();
    },
  });
  
  const updateClientMutation = trpc.pgClients.update.useMutation({
    onSuccess: () => {
      clientsQuery.refetch();
    },
  });
  
  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    createClient: createClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
  };
});
```

## Key Differences

### Storage Location
- **Before**: `backend/store/users.json`, `backend/store/clients_database.xlsx`
- **After**: PostgreSQL tables

### Activity History
- **Before**: Embedded array in client object
- **After**: Separate `visits` table with foreign key relationship

### Audit Trail
- **Before**: No audit logging
- **After**: Complete audit trail in `audit_logs` table

### Authentication
- **Before**: Simple comparison in `users.authenticate`
- **After**: Dedicated `auth.login` endpoint with audit logging

### Role-Based Access
- **Before**: Implemented in React context
- **After**: Enforced in database queries

## Rollback Plan

If you need to rollback to JSON files:

1. Export current data:
```typescript
const result = await trpcClient.pgExports.create.mutate({
  exportType: 'full',
  exportedBy: currentUser.id,
});
```

2. Use legacy endpoints:
```typescript
// Continue using:
trpc.users.list
trpc.users.create
trpc.clients.saveToStore
trpc.clients.loadFromStore
```

## Testing Migration

1. Test database connection:
```typescript
const status = await trpcClient.db.checkConnection.query();
```

2. Verify data integrity:
```typescript
const users = await trpcClient.pgUsers.list.query();
const clients = await trpcClient.pgClients.list.query({ userRole: 'admin' });

console.log(`Migrated ${users.length} users and ${clients.length} clients`);
```

3. Test role-based access:
```typescript
// Test admin access (should see all)
const adminClients = await trpcClient.pgClients.list.query({
  userRole: 'admin',
});

// Test sales access (should see only assigned)
const salesClients = await trpcClient.pgClients.list.query({
  userId: 'sales-user-id',
  userRole: 'sales',
});
```

## Production Considerations

Before going to production:

1. **Security**:
   - Implement password hashing (bcrypt/argon2)
   - Add JWT authentication
   - Enable SSL for database connections
   - Implement rate limiting

2. **Performance**:
   - Review and optimize indexes
   - Set up connection pooling limits
   - Implement caching layer (Redis)
   - Add query monitoring

3. **Backup**:
   - Set up automated backups
   - Test restore procedures
   - Document backup schedule
   - Store backups off-site

4. **Monitoring**:
   - Set up database monitoring
   - Configure error alerts
   - Track slow queries
   - Monitor connection pool usage

## Support

For issues during migration:
1. Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
2. Verify connection: `psql -U postgres -d crm_db`
3. Review audit logs: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;`
