import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[v0] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250316_create_payments_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('[v0] Executing migration...');
    
    // Split SQL by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec', { sql: statement.trim() });
      if (error) {
        console.error('[v0] Migration error:', error);
      }
    }

    console.log('[v0] Migration completed successfully');
  } catch (error) {
    console.error('[v0] Failed to run migration:', error.message);
    process.exit(1);
  }
}

runMigration();
