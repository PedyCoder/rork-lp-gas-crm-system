import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { exportExcelProcedure } from "./routes/clients/export-excel/route";
import { saveToStoreProcedure, loadFromStoreProcedure } from "./routes/clients/save-to-store/route";
import { listUsersProcedure } from "./routes/users/list/route";
import { createUserProcedure } from "./routes/users/create/route";
import { updateUserProcedure } from "./routes/users/update/route";
import { authenticateProcedure } from "./routes/users/authenticate/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  clients: createTRPCRouter({
    exportExcel: exportExcelProcedure,
    saveToStore: saveToStoreProcedure,
    loadFromStore: loadFromStoreProcedure,
  }),
  users: createTRPCRouter({
    list: listUsersProcedure,
    create: createUserProcedure,
    update: updateUserProcedure,
    authenticate: authenticateProcedure,
  }),
});

export type AppRouter = typeof appRouter;
