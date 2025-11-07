import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";

const DashboardStatsSchema = z.object({
  userId: z.string().optional(),
  userRole: z.enum(['admin', 'sales']).optional(),
});

export const getPgDashboardStatsProcedure = publicProcedure
  .input(DashboardStatsSchema)
  .query(async ({ input }) => {
    try {
      const { userId, userRole } = input;

      const whereClause = userRole === 'sales' && userId ? `WHERE assigned_to = '${userId}'` : '';

      const totalClientsResult = await query(`SELECT COUNT(*) as count FROM clients ${whereClause}`);
      const totalClients = parseInt(totalClientsResult.rows[0].count);

      const inProgressResult = await query(
        `SELECT COUNT(*) as count FROM clients ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'in_progress'`
      );
      const clientsInProgress = parseInt(inProgressResult.rows[0].count);

      const closedResult = await query(
        `SELECT COUNT(*) as count FROM clients ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'closed'`
      );
      const closedClients = parseInt(closedResult.rows[0].count);

      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);

      const lastMonthStart = new Date(thisMonthStart);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

      const visitJoin = userRole === 'sales' && userId
        ? `INNER JOIN clients c ON v.client_id = c.id AND c.assigned_to = '${userId}'`
        : '';

      const visitsThisMonthResult = await query(
        `SELECT COUNT(*) as count FROM visits v ${visitJoin} WHERE v.type = 'visit' AND v.date >= $1`,
        [thisMonthStart.toISOString()]
      );
      const visitsThisMonth = parseInt(visitsThisMonthResult.rows[0].count);

      const visitsLastMonthResult = await query(
        `SELECT COUNT(*) as count FROM visits v ${visitJoin} WHERE v.type = 'visit' AND v.date >= $1 AND v.date < $2`,
        [lastMonthStart.toISOString(), thisMonthStart.toISOString()]
      );
      const visitsLastMonth = parseInt(visitsLastMonthResult.rows[0].count);

      const newClientsResult = await query(
        `SELECT COUNT(*) as count FROM clients ${whereClause ? whereClause + ' AND' : 'WHERE'} created_at >= $1`,
        [thisMonthStart.toISOString()]
      );
      const newClientsThisMonth = parseInt(newClientsResult.rows[0].count);

      const dailyVisitsResult = await query(
        `SELECT DATE(v.date) as date, COUNT(*) as count
         FROM visits v ${visitJoin}
         WHERE v.type = 'visit' AND v.date >= $1
         GROUP BY DATE(v.date)
         ORDER BY date DESC
         LIMIT 30`,
        [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()]
      );

      const dailyVisits = dailyVisitsResult.rows.map((row) => ({
        date: row.date,
        count: parseInt(row.count),
      }));

      const recentVisitsResult = await query(
        `SELECT v.*, c.name as client_name, u.name as created_by_name
         FROM visits v
         INNER JOIN clients c ON v.client_id = c.id
         INNER JOIN users u ON v.created_by = u.id
         ${userRole === 'sales' && userId ? `WHERE c.assigned_to = '${userId}'` : ''}
         ORDER BY v.date DESC
         LIMIT 10`
      );

      const recentVisits = recentVisitsResult.rows.map((row) => ({
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        date: row.date,
        notes: row.notes,
        createdBy: row.created_by_name,
      }));

      return {
        totalClients,
        clientsInProgress,
        closedClients,
        visitsThisMonth,
        visitsLastMonth,
        newClientsThisMonth,
        dailyVisits,
        recentVisits,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalClients: 0,
        clientsInProgress: 0,
        closedClients: 0,
        visitsThisMonth: 0,
        visitsLastMonth: 0,
        newClientsThisMonth: 0,
        dailyVisits: [],
        recentVisits: [],
      };
    }
  });
