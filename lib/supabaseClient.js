<<<<<<< HEAD
import { createClient } from "@supabase/supabase-js";
=======
// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
>>>>>>> c59a53a (Update project files)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

<<<<<<< HEAD
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
=======
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
>>>>>>> c59a53a (Update project files)
