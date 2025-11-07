import { publicProcedure } from "@/backend/trpc/create-context";
import { query } from "@/backend/db/config";

export const listPgUsersProcedure = publicProcedure.query(async () => {
  try {
    const result = await query(
      `SELECT id, name, email, role, is_active, created_at, updated_at, last_login, login_count 
       FROM users 
       ORDER BY created_at DESC`
    );

    return result.rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
      loginCount: user.login_count,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
});
