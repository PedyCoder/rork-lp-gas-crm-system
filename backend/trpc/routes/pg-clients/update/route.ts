import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";
import { v4 as uuidv4 } from 'uuid';

const UpdateClientSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.enum(['residential', 'restaurant', 'commercial', 'food_truck', 'forklift']).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['new', 'in_progress', 'closed']).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  area: z.string().optional(),
  lastVisit: z.string().nullable().optional(),
  updatedBy: z.string(),
});

export const updatePgClientProcedure = publicProcedure
  .input(UpdateClientSchema)
  .mutation(async ({ input }) => {
    try {
      const { id, updatedBy, ...updates } = input;

      const oldResult = await query('SELECT * FROM clients WHERE id = $1', [id]);
      if (oldResult.rows.length === 0) {
        return {
          success: false,
          error: 'Client not found',
        };
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          updateFields.push(`${snakeKey} = $${paramIndex++}`);
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        return {
          success: false,
          error: 'No fields to update',
        };
      }

      values.push(id);
      const updateQuery = `UPDATE clients SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
      await query(updateQuery, values);

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          auditId,
          updatedBy,
          'update',
          'client',
          id,
          JSON.stringify(oldResult.rows[0]),
          JSON.stringify(updates),
        ]
      );

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating client:', error);
      return {
        success: false,
        error: 'Failed to update client',
      };
    }
  });
