import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";

const ListVisitsSchema = z.object({
  clientId: z.string().optional(),
  createdBy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['visit', 'follow_up', 'note']).optional(),
});

export const listPgVisitsProcedure = publicProcedure
  .input(ListVisitsSchema)
  .query(async ({ input }) => {
    try {
      const { clientId, createdBy, startDate, endDate, type } = input;

      let queryText = `
        SELECT v.*, c.name as client_name, u.name as created_by_name
        FROM visits v
        LEFT JOIN clients c ON v.client_id = c.id
        LEFT JOIN users u ON v.created_by = u.id
        WHERE 1=1
      `;

      const values: any[] = [];
      let paramIndex = 1;

      if (clientId) {
        queryText += ` AND v.client_id = $${paramIndex++}`;
        values.push(clientId);
      }

      if (createdBy) {
        queryText += ` AND v.created_by = $${paramIndex++}`;
        values.push(createdBy);
      }

      if (type) {
        queryText += ` AND v.type = $${paramIndex++}`;
        values.push(type);
      }

      if (startDate) {
        queryText += ` AND v.date >= $${paramIndex++}`;
        values.push(startDate);
      }

      if (endDate) {
        queryText += ` AND v.date <= $${paramIndex++}`;
        values.push(endDate);
      }

      queryText += ' ORDER BY v.date DESC';

      const result = await query(queryText, values);

      return result.rows.map((row) => ({
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        type: row.type,
        date: row.date,
        notes: row.notes,
        nextFollowUpDate: row.next_follow_up_date,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Error fetching visits:', error);
      return [];
    }
  });
