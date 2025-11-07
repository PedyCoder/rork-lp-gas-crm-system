import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import * as XLSX from "xlsx";

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
  credit: z.boolean(),
  creditDays: z.number().int().nullable(),
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

const ExportRequestSchema = z.object({
  clients: z.array(ClientSchema),
  exportDate: z.string(),
  exportedBy: z.string(),
  filters: z.object({
    type: z.string().optional(),
    status: z.string().optional(),
    area: z.string().optional(),
    salesRep: z.string().optional(),
  }).optional(),
});

export const exportExcelProcedure = publicProcedure
  .input(ExportRequestSchema)
  .query(({ input }) => {
    const { clients, exportDate, exportedBy, filters } = input;

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
      'Crédito': client.credit ? 'Sí' : 'No',
      'Días de Crédito': client.credit && client.creditDays !== null ? client.creditDays : '',
      'Última Visita': client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('es-ES') : 'N/A',
      'Notas': client.notes,
      'Fecha de Creación': new Date(client.createdAt).toLocaleDateString('es-ES'),
      'Última Actualización': new Date(client.updatedAt).toLocaleDateString('es-ES'),
      'Historial de Actividades': client.activityHistory?.length || 0,
    }));

    const metadataRows = [
      ['Exportación de Clientes CRM'],
      [''],
      ['Fecha de Exportación:', new Date(exportDate).toLocaleString('es-ES')],
      ['Exportado Por:', exportedBy],
      ['Total de Clientes:', clients.length],
    ];

    if (filters && Object.values(filters).some(v => v && v !== 'all')) {
      metadataRows.push(['']);
      metadataRows.push(['Filtros Aplicados:']);
      if (filters.type && filters.type !== 'all') {
        metadataRows.push(['- Tipo:', CLIENT_TYPE_LABELS[filters.type] || filters.type]);
      }
      if (filters.status && filters.status !== 'all') {
        metadataRows.push(['- Estado:', STATUS_LABELS[filters.status] || filters.status]);
      }
      if (filters.area && filters.area !== 'all') {
        metadataRows.push(['- Área:', filters.area]);
      }
      if (filters.salesRep && filters.salesRep !== 'all') {
        metadataRows.push(['- Vendedor:', filters.salesRep]);
      }
    }

    metadataRows.push(['']);
    metadataRows.push(['']);

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
      { wch: 20 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    return {
      excel: excelBuffer,
      filename: `clientes_${new Date(exportDate).toISOString().split('T')[0]}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  });
