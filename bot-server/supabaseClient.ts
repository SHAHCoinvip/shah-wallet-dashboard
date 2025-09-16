import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // make sure this is relative to where the file runs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
