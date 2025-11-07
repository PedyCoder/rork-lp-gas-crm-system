import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "backend", "store", "users.json");

const authenticateSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authenticateProcedure = publicProcedure
  .input(authenticateSchema)
  .mutation(async ({ input }) => {
    try {
      const data = await fs.readFile(USERS_FILE, "utf-8");
      const users = JSON.parse(data);

      const user = users.find(
        (u: any) =>
          u.email.toLowerCase() === input.email.toLowerCase() &&
          u.password === input.password
      );

      if (!user) {
        return { success: false, error: "Correo o contraseña incorrectos" };
      }

      if (!user.isActive) {
        return { success: false, error: "La cuenta está desactivada" };
      }

      user.lastLogin = new Date().toISOString();
      user.loginCount = (user.loginCount || 0) + 1;

      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error("Error during authentication:", error);
      return { success: false, error: "Error al iniciar sesión" };
    }
  });
