import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { exportExcelProcedure } from "./routes/clients/export-excel/route";
import { saveToStoreProcedure, loadFromStoreProcedure } from "./routes/clients/save-to-store/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  clients: createTRPCRouter({
    exportExcel: exportExcelProcedure,
    saveToStore: saveToStoreProcedure,
    loadFromStore: loadFromStoreProcedure,
  }),
});

export type AppRouter = typeof appRouter;
