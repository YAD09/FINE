
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyvsqmxbzxbcnsghamdf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dnNxbXhienhiY25zZ2hhbWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTc5MjgsImV4cCI6MjA4MDY3MzkyOH0.jiv-thTHnX_BcAhU6MDkDiPe_vKAgtsGRuVkzTW0YKM';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
