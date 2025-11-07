import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";
import { v4 as uuidv4 } from 'uuid';

const DeleteClientSchema = z.object({
  id: z.string(),
  deletedBy: z.string(),
});

export const deletePgClientProcedure = publicProcedure
  .input(DeleteClientSchema)
  .mutation(async ({ input }) => {
    try {
      const { id, deletedBy } = input;

      const oldResult = await query('SELECT * FROM clients WHERE id = $1', [id]);
      if (oldResult.rows.length === 0) {
        return {
          success: false,
          error: 'Client not found',
        };
      }

      await query('DELETE FROM clients WHERE id = $1', [id]);

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [auditId, deletedBy, 'delete', 'client', id, JSON.stringify(oldResult.rows[0])]
      );

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting client:', error);
      return {
        success: false,
        error: 'Failed to delete client',
      };
    }
  });
