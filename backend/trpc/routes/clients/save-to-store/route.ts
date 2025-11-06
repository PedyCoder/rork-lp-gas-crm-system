import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import * as XLSX from "xlsx";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['residential', 'restaurant', 'commercial', 'food_truck', 'forklift']),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  lastVisit: z.string().nullable(),
  status: z.enum(['new', 'in_progress', 'closed']),
  notes: z.string(),
  assignedTo: z.string(),
  area: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  activityHistory: z.array(z.object({
    id: z.string(),
    type: z.enum(['visit', 'follow_up', 'note']),
    date: z.string(),
    notes: z.string(),
    nextFollowUpDate: z.string().optional(),
    createdBy: z.string(),
  })).optional(),
});

const SaveRequestSchema = z.object({
  clients: z.array(ClientSchema),
});

export const saveToStoreProcedure = publicProcedure
  .input(SaveRequestSchema)
  .mutation(async ({ input }) => {
    const { clients } = input;

    const storePath = join(process.cwd(), 'backend', 'store');
    if (!existsSync(storePath)) {
      await mkdir(storePath, { recursive: true });
    }

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

    const exportData = clients.map((client) => ({
      'ID': client.id,
      'Nombre': client.name,
      'Tipo': CLIENT_TYPE_LABELS[client.type] || client.type,
      'Estado': STATUS_LABELS[client.status] || client.status,
      'Área': client.area,
      'Dirección': client.address,
      'Teléfono': client.phone,
      'Email': client.email,
      'Asignado A': client.assignedTo,
      'Última Visita': client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('es-ES') : 'N/A',
      'Notas': client.notes,
      'Fecha de Creación': new Date(client.createdAt).toLocaleDateString('es-ES'),
      'Última Actualización': new Date(client.updatedAt).toLocaleDateString('es-ES'),
      'Historial de Actividades (JSON)': client.activityHistory ? JSON.stringify(client.activityHistory) : '',
    }));

    const timestamp = new Date().toISOString();
    const metadataRows = [
      ['Base de Datos de Clientes CRM'],
      [''],
      ['Última Actualización:', new Date(timestamp).toLocaleString('es-ES')],
      ['Total de Clientes:', clients.length],
      [''],
      [''],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(metadataRows);
    XLSX.utils.sheet_add_json(worksheet, exportData, { origin: -1, skipHeader: false });

    const colWidths = [
      { wch: 20 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 50 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const filename = 'clients_database.xlsx';
    const filepath = join(storePath, filename);
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    await writeFile(filepath, buffer);

    const backupFilename = `clients_database_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
    const backupPath = join(storePath, backupFilename);
    await writeFile(backupPath, buffer);

    return {
      success: true,
      filepath,
      timestamp,
      clientCount: clients.length,
    };
  });

export const loadFromStoreProcedure = publicProcedure
  .query(async () => {
    const storePath = join(process.cwd(), 'backend', 'store');
    const filepath = join(storePath, 'clients_database.xlsx');

    if (!existsSync(filepath)) {
      return {
        success: false,
        clients: [],
        message: 'No stored database found',
      };
    }

    const buffer = await readFile(filepath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    const TYPE_REVERSE_MAP: Record<string, string> = {
      'Residencial': 'residential',
      'Restaurante': 'restaurant',
      'Comercial': 'commercial',
      'Food Truck': 'food_truck',
      'Montacargas': 'forklift',
    };

    const STATUS_REVERSE_MAP: Record<string, string> = {
      'Nuevo': 'new',
      'En Progreso': 'in_progress',
      'Cerrado': 'closed',
    };

    const clients = data
      .filter((row: any) => row['ID'])
      .map((row: any) => {
        const activityHistory = row['Historial de Actividades (JSON)'];
        let parsedHistory;
        try {
          parsedHistory = activityHistory ? JSON.parse(activityHistory) : [];
        } catch {
          parsedHistory = [];
        }

        const lastVisitStr = row['Última Visita'];
        let lastVisit: string | null = null;
        if (lastVisitStr && lastVisitStr !== 'N/A') {
          try {
            const parts = lastVisitStr.split('/');
            if (parts.length === 3) {
              lastVisit = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).toISOString();
            }
          } catch (e) {
            console.error('Error parsing lastVisit:', e);
          }
        }

        return {
          id: row['ID'],
          name: row['Nombre'],
          type: TYPE_REVERSE_MAP[row['Tipo']] || 'commercial',
          address: row['Dirección'] || '',
          phone: row['Teléfono'] || '',
          email: row['Email'] || '',
          lastVisit,
          status: STATUS_REVERSE_MAP[row['Estado']] || 'new',
          notes: row['Notas'] || '',
          assignedTo: row['Asignado A'] || '',
          area: row['Área'] || '',
          createdAt: row['Fecha de Creación'] || new Date().toISOString(),
          updatedAt: row['Última Actualización'] || new Date().toISOString(),
          activityHistory: parsedHistory,
        };
      });

    return {
      success: true,
      clients,
      message: `Loaded ${clients.length} clients from store`,
    };
  });
