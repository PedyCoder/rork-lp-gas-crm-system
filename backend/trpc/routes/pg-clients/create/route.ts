import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";
import { v4 as uuidv4 } from 'uuid';

const CreateClientSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['residential', 'restaurant', 'commercial', 'food_truck', 'forklift']),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  status: z.enum(['new', 'in_progress', 'closed']),
  notes: z.string(),
  assignedTo: z.string(),
  area: z.string(),
  credit: z.boolean(),
  creditDays: z.number().int().nullable(),
  createdBy: z.string(),
});

export const createPgClientProcedure = publicProcedure
  .input(CreateClientSchema)
  .mutation(async ({ input }) => {
    try {
      const { name, type, address, phone, email, status, notes, assignedTo, area, credit, creditDays, createdBy } = input;
      const id = uuidv4();

      await query(
        `INSERT INTO clients (id, name, type, address, phone, email, status, notes, assigned_to, area, credit, credit_days, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, name, type, address, phone, email, status, notes, assignedTo, area, credit, creditDays]
      );

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [auditId, createdBy, 'create', 'client', id, JSON.stringify(input)]
      );

      return {
        success: true,
        clientId: id,
      };
    } catch (error: any) {
      console.error('Error creating client:', error);
      return {
        success: false,
        error: 'Failed to create client',
      };
    }
  });
