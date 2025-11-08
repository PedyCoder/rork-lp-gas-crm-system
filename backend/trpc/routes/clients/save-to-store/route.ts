import { publicProcedure } from "../../../create-context";
import { z } from "zod";

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
  hasCredit: z.boolean(),
  creditDays: z.number().optional(),
  hasDiscount: z.boolean(),
  discountAmount: z.number().optional(),
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

    const timestamp = new Date().toISOString();
    const dataToStore = {
      lastUpdated: timestamp,
      clientCount: clients.length,
      clients: clients,
    };

    try {
      const jsonString = JSON.stringify(dataToStore, null, 2);
      const filePath = './backend/store/clients.json';
      await Bun.write(filePath, jsonString);

      console.log(`✅ Saved ${clients.length} clients to store`);

      return {
        success: true,
        timestamp,
        clientCount: clients.length,
      };
    } catch (error) {
      console.error('❌ Error saving to store:', error);
      throw new Error('Failed to save clients to store');
    }
  });

export const loadFromStoreProcedure = publicProcedure
  .query(async () => {
    try {
      const filePath = './backend/store/clients.json';
      const file = Bun.file(filePath);
      
      if (!(await file.exists())) {
        console.log('📋 No stored database found, returning empty array');
        return {
          success: false,
          clients: [],
          message: 'No stored database found',
        };
      }

      const data = await file.json();
      const clients = data.clients || [];

      console.log(`✅ Loaded ${clients.length} clients from store`);

      return {
        success: true,
        clients,
        message: `Loaded ${clients.length} clients from store`,
      };
    } catch (error) {
      console.error('❌ Error loading from store:', error);
      return {
        success: false,
        clients: [],
        message: 'Error loading clients from store',
      };
    }
  });
