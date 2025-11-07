import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";

const ListClientsSchema = z.object({
  userId: z.string().optional(),
  userRole: z.enum(['admin', 'sales']).optional(),
  status: z.enum(['new', 'in_progress', 'closed']).optional(),
  type: z.enum(['residential', 'restaurant', 'commercial', 'food_truck', 'forklift']).optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
});

export const listPgClientsProcedure = publicProcedure
  .input(ListClientsSchema)
  .query(async ({ input }) => {
    try {
      const { userId, userRole, status, type, assignedTo, search } = input;

      let queryText = `
        SELECT c.*, 
          (SELECT json_agg(json_build_object(
            'id', v.id,
            'type', v.type,
            'date', v.date,
            'notes', v.notes,
            'nextFollowUpDate', v.next_follow_up_date,
            'createdBy', v.created_by
          ) ORDER BY v.date DESC)
          FROM visits v
          WHERE v.client_id = c.id) as activity_history
        FROM clients c
        WHERE 1=1
      `;

      const values: any[] = [];
      let paramIndex = 1;

      if (userRole === 'sales' && userId) {
        queryText += ` AND c.assigned_to = $${paramIndex++}`;
        values.push(userId);
      }

      if (status) {
        queryText += ` AND c.status = $${paramIndex++}`;
        values.push(status);
      }

      if (type) {
        queryText += ` AND c.type = $${paramIndex++}`;
        values.push(type);
      }

      if (assignedTo) {
        queryText += ` AND c.assigned_to = $${paramIndex++}`;
        values.push(assignedTo);
      }

      if (search) {
        queryText += ` AND (c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
      }

      queryText += ' ORDER BY c.created_at DESC';

      const result = await query(queryText, values);

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        address: row.address,
        phone: row.phone,
        email: row.email,
        lastVisit: row.last_visit,
        status: row.status,
        notes: row.notes,
        assignedTo: row.assigned_to,
        area: row.area,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        activityHistory: row.activity_history || [],
      }));
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  });
