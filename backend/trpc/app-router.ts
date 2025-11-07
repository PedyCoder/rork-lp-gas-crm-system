import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { exportExcelProcedure } from "./routes/clients/export-excel/route";
import { saveToStoreProcedure, loadFromStoreProcedure } from "./routes/clients/save-to-store/route";
import { listUsersProcedure } from "./routes/users/list/route";
import { createUserProcedure } from "./routes/users/create/route";
import { updateUserProcedure } from "./routes/users/update/route";
import { authenticateProcedure } from "./routes/users/authenticate/route";
import { initDbProcedure, checkDbConnectionProcedure } from "./routes/db/init/route";
import { loginProcedure } from "./routes/auth/login/route";
import { listPgUsersProcedure } from "./routes/pg-users/list/route";
import { createPgUserProcedure } from "./routes/pg-users/create/route";
import { updatePgUserProcedure } from "./routes/pg-users/update/route";
import { listPgClientsProcedure } from "./routes/pg-clients/list/route";
import { createPgClientProcedure } from "./routes/pg-clients/create/route";
import { updatePgClientProcedure } from "./routes/pg-clients/update/route";
import { deletePgClientProcedure } from "./routes/pg-clients/delete/route";
import { createPgVisitProcedure } from "./routes/pg-visits/create/route";
import { listPgVisitsProcedure } from "./routes/pg-visits/list/route";
import { createPgExportProcedure } from "./routes/pg-exports/create/route";
import { listPgAuditLogsProcedure } from "./routes/pg-audit/list/route";
import { getPgDashboardStatsProcedure } from "./routes/pg-dashboard/stats/route";

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
  db: createTRPCRouter({
    init: initDbProcedure,
    checkConnection: checkDbConnectionProcedure,
  }),
  auth: createTRPCRouter({
    login: loginProcedure,
  }),
  pgUsers: createTRPCRouter({
    list: listPgUsersProcedure,
    create: createPgUserProcedure,
    update: updatePgUserProcedure,
  }),
  pgClients: createTRPCRouter({
    list: listPgClientsProcedure,
    create: createPgClientProcedure,
    update: updatePgClientProcedure,
    delete: deletePgClientProcedure,
  }),
  pgVisits: createTRPCRouter({
    create: createPgVisitProcedure,
    list: listPgVisitsProcedure,
  }),
  pgExports: createTRPCRouter({
    create: createPgExportProcedure,
  }),
  pgAudit: createTRPCRouter({
    list: listPgAuditLogsProcedure,
  }),
  pgDashboard: createTRPCRouter({
    stats: getPgDashboardStatsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
