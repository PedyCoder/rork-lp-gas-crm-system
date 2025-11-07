import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { query } from "@/backend/db/config";
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from "xlsx";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const CreateExportSchema = z.object({
  exportType: z.enum(['clients', 'visits', 'full']),
  filters: z.any().optional(),
  exportedBy: z.string(),
});

export const createPgExportProcedure = publicProcedure
  .input(CreateExportSchema)
  .mutation(async ({ input }) => {
    try {
      const { exportType, filters, exportedBy } = input;

      let data: any[] = [];
      let recordCount = 0;

      if (exportType === 'clients' || exportType === 'full') {
        const clientsResult = await query('SELECT * FROM clients ORDER BY created_at DESC');
        data = clientsResult.rows;
        recordCount = clientsResult.rowCount || 0;
      }

      const storePath = join(process.cwd(), 'backend', 'store', 'exports');
      if (!existsSync(storePath)) {
        await mkdir(storePath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `export_${exportType}_${timestamp}.xlsx`;
      const filepath = join(storePath, filename);

      const workbook = XLSX.utils.book_new();

      if (exportType === 'clients' || exportType === 'full') {
        const CLIENT_TYPE_LABELS: Record<string, string> = {
          residential: 'Residencial',
          restaurant: 'Restaurante',
          commercial: 'Comercial',
          food_truck: 'Food Truck',
          forklift: 'Montacargas',
        };

        const STATUS_LABELS: Record<string, string> = {
          new: 'Nuevo',
          in_progress: 'En Progreso',
          closed: 'Cerrado',
        };

        const exportData = data.map((client) => ({
          'ID': client.id,
          'Nombre': client.name,
          'Tipo': CLIENT_TYPE_LABELS[client.type] || client.type,
          'Estado': STATUS_LABELS[client.status] || client.status,
          'Área': client.area,
          'Dirección': client.address,
          'Teléfono': client.phone,
          'Email': client.email,
          'Asignado A': client.assigned_to,
          'Última Visita': client.last_visit ? new Date(client.last_visit).toLocaleDateString('es-ES') : 'N/A',
          'Notas': client.notes,
          'Fecha de Creación': new Date(client.created_at).toLocaleDateString('es-ES'),
          'Última Actualización': new Date(client.updated_at).toLocaleDateString('es-ES'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      await writeFile(filepath, buffer);

      const fileSize = buffer.length;
      const id = uuidv4();

      await query(
        `INSERT INTO exports (id, export_type, file_name, file_path, file_size, exported_by, filters, record_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [id, exportType, filename, filepath, fileSize, exportedBy, JSON.stringify(filters || {}), recordCount]
      );

      const auditId = uuidv4();
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [auditId, exportedBy, 'create', 'export', id, JSON.stringify({ exportType, recordCount })]
      );

      return {
        success: true,
        exportId: id,
        filename,
        filepath,
        recordCount,
      };
    } catch (error: any) {
      console.error('Error creating export:', error);
      return {
        success: false,
        error: 'Failed to create export',
      };
    }
  });
