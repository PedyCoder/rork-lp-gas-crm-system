import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";
import { v4 as uuidv4 } from 'uuid';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginProcedure = publicProcedure
  .input(LoginSchema)
  .mutation(async ({ input }) => {
    try {
      const { email, password } = input;

      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      const user = result.rows[0];

      if (user.password !== password) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = $1',
        [user.id]
      );

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [auditId, user.id, 'login', 'auth', user.id]
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
        },
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  });
