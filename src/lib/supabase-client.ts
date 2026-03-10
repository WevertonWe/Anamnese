import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Variáveis do Supabase (URL/KEY) estão faltando no .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
