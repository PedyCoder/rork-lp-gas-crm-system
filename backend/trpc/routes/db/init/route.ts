import { publicProcedure } from "@/backend/trpc/create-context";
import { initializeDatabase, checkConnection } from "@/backend/db/init";

export const initDbProcedure = publicProcedure.mutation(async () => {
  try {
    const isConnected = await checkConnection();
    
    if (!isConnected) {
      return {
        success: false,
        error: 'Failed to connect to database. Please check your connection settings.',
      };
    }

    await initializeDatabase();
    
    return {
      success: true,
      message: 'Database initialized successfully',
    };
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
});

export const checkDbConnectionProcedure = publicProcedure.query(async () => {
  try {
    const isConnected = await checkConnection();
    return {
      connected: isConnected,
      message: isConnected ? 'Database connected' : 'Database connection failed',
    };
  } catch (error: any) {
    return {
      connected: false,
      message: error.message || 'Unknown error occurred',
    };
  }
});
