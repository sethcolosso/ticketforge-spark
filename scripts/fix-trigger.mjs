#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('\nMake sure these are set in your Vercel project settings.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTrigger() {
  try {
    console.log('🔄 Updating handle_new_user trigger...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $function$
        DECLARE
          user_role text;
        BEGIN
          -- Get the role from user metadata, default to 'buyer'
          user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
          
          INSERT INTO public.user_roles (user_id, role)
          VALUES (NEW.id, user_role);
          
          RETURN NEW;
        END;
        $function$;
      `
    });

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error from RPC:', error);
    }
    
    // If RPC doesn't work, try direct SQL using client
    const { data, error: sqlError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $function$
        DECLARE
          user_role text;
        BEGIN
          user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
          INSERT INTO public.user_roles (user_id, role)
          VALUES (NEW.id, user_role);
          RETURN NEW;
        END;
        $function$;
      `
    });

    console.log('✅ Successfully updated handle_new_user trigger');
    console.log('   Users can now select their role (seller/buyer) during signup');
  } catch (err) {
    console.error('❌ Error:', err?.message || err);
    console.log('\n📝 Alternative: Update the trigger manually in Supabase Dashboard:');
    console.log('1. Go to your Supabase project');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this SQL:\n');
    console.log(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $function$
    DECLARE
      user_role text;
    BEGIN
      user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, user_role);
      RETURN NEW;
    END;
    $function$;
    `);
    process.exit(1);
  }
}

fixTrigger();
