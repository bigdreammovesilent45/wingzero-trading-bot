import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmvgldjhangozjgbbyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdmdsamRqaGFuZ296amdlYnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk1NDUsImV4cCI6MjA1MDgzNTU0NX0.wHTFi1bG8Yt8bYWCzZ_Ndf1y4sM-F4oL9CxAStlpXC8';

export const supabase = createClient(supabaseUrl, supabaseKey);