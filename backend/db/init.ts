import { readFile } from 'fs/promises';
import { join } from 'path';
import pool from './config';

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    const schemaPath = join(process.cwd(), 'backend', 'db', 'schema.sql');
    const schema = await readFile(schemaPath, 'utf-8');
    
    await pool.query(schema);
    
    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function checkConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
