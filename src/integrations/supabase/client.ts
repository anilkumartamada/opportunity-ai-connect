// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xhkyetlapzkmcikqzipe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoa3lldGxhcHprbWNpa3F6aXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTAzNjgsImV4cCI6MjA2MDAyNjM2OH0.jAIDW40eo9oqnR7x1Fc3Q5XPVdztiW4-qMtCpAZMDTI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);