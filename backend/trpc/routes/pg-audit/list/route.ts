import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";

const ListAuditLogsSchema = z.object({
  userId: z.string().optional(),
  entityType: z.enum(['user', 'client', 'visit', 'attachment', 'export', 'auth']).optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().default(100),
  offset: z.number().default(0),
});

export const listPgAuditLogsProcedure = publicProcedure
  .input(ListAuditLogsSchema)
  .query(async ({ input }) => {
    try {
      const { userId, entityType, entityId, action, startDate, endDate, limit, offset } = input;

      let queryText = `
        SELECT a.*, u.name as user_name, u.email as user_email
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1
      `;

      const values: any[] = [];
      let paramIndex = 1;

      if (userId) {
        queryText += ` AND a.user_id = $${paramIndex++}`;
        values.push(userId);
      }

      if (entityType) {
        queryText += ` AND a.entity_type = $${paramIndex++}`;
        values.push(entityType);
      }

      if (entityId) {
        queryText += ` AND a.entity_id = $${paramIndex++}`;
        values.push(entityId);
      }

      if (action) {
        queryText += ` AND a.action = $${paramIndex++}`;
        values.push(action);
      }

      if (startDate) {
        queryText += ` AND a.created_at >= $${paramIndex++}`;
        values.push(startDate);
      }

      if (endDate) {
        queryText += ` AND a.created_at <= $${paramIndex++}`;
        values.push(endDate);
      }

      queryText += ` ORDER BY a.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(limit, offset);

      const result = await query(queryText, values);

      return result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        oldValues: row.old_values,
        newValues: row.new_values,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  });
