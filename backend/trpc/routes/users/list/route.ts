import { publicProcedure } from "@/backend/trpc/create-context";
import fs from "fs/promises";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "backend", "store", "users.json");

export const listUsersProcedure = publicProcedure.query(async () => {
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    const users = JSON.parse(data);
    return users;
  } catch (error) {
    return [];
  }
});
