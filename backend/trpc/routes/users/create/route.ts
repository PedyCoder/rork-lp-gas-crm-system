import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "backend", "store", "users.json");

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "sales"]),
  password: z.string(),
});

export const createUserProcedure = publicProcedure
  .input(createUserSchema)
  .mutation(async ({ input }) => {
    try {
      let users = [];
      try {
        const data = await fs.readFile(USERS_FILE, "utf-8");
        users = JSON.parse(data);
      } catch (error) {
        console.log("No existing users file, creating new one");
      }

      const existingUser = users.find(
        (u: any) => u.email.toLowerCase() === input.email.toLowerCase()
      );
      if (existingUser) {
        throw new Error("El correo electrónico ya está en uso");
      }

      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: input.name,
        email: input.email,
        role: input.role,
        password: input.password,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0,
      };

      users.push(newUser);

      const storeDir = path.dirname(USERS_FILE);
      await fs.mkdir(storeDir, { recursive: true });
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

      const { password: _, ...userWithoutPassword } = newUser;
      return { success: true, user: userWithoutPassword };
    } catch (error: any) {
      console.error("Error creating user:", error);
      throw new Error(error.message || "Error al crear usuario");
    }
  });
