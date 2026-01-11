import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// SUPABASE_SERVICE_KEY, panelde "service_role" olarak geçen gizli anahtardır.
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');