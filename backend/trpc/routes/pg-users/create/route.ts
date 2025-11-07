import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";
import { v4 as uuidv4 } from 'uuid';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'sales']),
  createdBy: z.string(),
});

export const createPgUserProcedure = publicProcedure
  .input(CreateUserSchema)
  .mutation(async ({ input }) => {
    try {
      const { name, email, password, role, createdBy } = input;
      const id = uuidv4();

      const checkResult = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (checkResult.rows.length > 0) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      await query(
        `INSERT INTO users (id, name, email, password, role, is_active, created_at, login_count)
         VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, 0)`,
        [id, name, email, password, role]
      );

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [auditId, createdBy, 'create', 'user', id, JSON.stringify({ name, email, role })]
      );

      return {
        success: true,
        userId: id,
      };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: 'Failed to create user',
      };
    }
  });
