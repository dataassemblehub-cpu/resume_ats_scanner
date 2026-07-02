import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qnmxuzobldgcgbcixazl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubXh1em9ibGRnY2diY2l4YXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTgzOTEsImV4cCI6MjA5NzA3NDM5MX0.N6Ovuyabo2MeVjSpEIYTTKMHI4IZfvRHN0-x8G0kaG4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
