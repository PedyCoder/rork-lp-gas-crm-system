import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";
import { v4 as uuidv4 } from 'uuid';

const CreateVisitSchema = z.object({
  clientId: z.string(),
  type: z.enum(['visit', 'follow_up', 'note']),
  date: z.string(),
  notes: z.string(),
  nextFollowUpDate: z.string().optional(),
  createdBy: z.string(),
});

export const createPgVisitProcedure = publicProcedure
  .input(CreateVisitSchema)
  .mutation(async ({ input }) => {
    try {
      const { clientId, type, date, notes, nextFollowUpDate, createdBy } = input;
      const id = uuidv4();

      await query(
        `INSERT INTO visits (id, client_id, type, date, notes, next_follow_up_date, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [id, clientId, type, date, notes, nextFollowUpDate || null, createdBy]
      );

      if (type === 'visit') {
        await query(
          'UPDATE clients SET last_visit = $1 WHERE id = $2',
          [date, clientId]
        );
      }

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [auditId, createdBy, 'create', 'visit', id, JSON.stringify(input)]
      );

      return {
        success: true,
        visitId: id,
      };
    } catch (error: any) {
      console.error('Error creating visit:', error);
      return {
        success: false,
        error: 'Failed to create visit',
      };
    }
  });
