import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";
import { v4 as uuidv4 } from 'uuid';

const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'sales']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  updatedBy: z.string(),
});

export const updatePgUserProcedure = publicProcedure
  .input(UpdateUserSchema)
  .mutation(async ({ input }) => {
    try {
      const { id, name, email, role, isActive, password, updatedBy } = input;

      const oldResult = await query('SELECT * FROM users WHERE id = $1', [id]);
      if (oldResult.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
      }
      if (role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(role);
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(isActive);
      }
      if (password !== undefined) {
        updates.push(`password = $${paramIndex++}`);
        values.push(password);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: 'No fields to update',
        };
      }

      values.push(id);
      const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      await query(updateQuery, values);

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          auditId,
          updatedBy,
          'update',
          'user',
          id,
          JSON.stringify(oldResult.rows[0]),
          JSON.stringify({ name, email, role, isActive }),
        ]
      );

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: 'Failed to update user',
      };
    }
  });
