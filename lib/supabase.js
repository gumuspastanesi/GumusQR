import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// Vercel Environment Variables kısmında "SUPABASE_SERVICE_KEY" olarak tanımlanmalıdır.
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');