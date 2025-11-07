import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "backend", "store", "users.json");

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "sales"]).optional(),
  password: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserProcedure = publicProcedure
  .input(updateUserSchema)
  .mutation(async ({ input }) => {
    try {
      const data = await fs.readFile(USERS_FILE, "utf-8");
      let users = JSON.parse(data);

      const userIndex = users.findIndex((u: any) => u.id === input.id);
      if (userIndex === -1) {
        throw new Error("Usuario no encontrado");
      }

      if (input.email) {
        const emailExists = users.some(
          (u: any, idx: number) =>
            idx !== userIndex &&
            u.email.toLowerCase() === input.email!.toLowerCase()
        );
        if (emailExists) {
          throw new Error("El correo electrónico ya está en uso");
        }
      }

      const updatedUser = {
        ...users[userIndex],
        ...input,
        updatedAt: new Date().toISOString(),
      };

      users[userIndex] = updatedUser;

      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

      const { password: _, ...userWithoutPassword } = updatedUser;
      return { success: true, user: userWithoutPassword };
    } catch (error: any) {
      console.error("Error updating user:", error);
      throw new Error(error.message || "Error al actualizar usuario");
    }
  });
