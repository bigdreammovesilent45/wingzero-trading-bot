import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmvgldjhangozjgbbyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdmdsZGpoYW5nb3hqemdiYnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzMxNDksImV4cCI6MjA2ODkwOTE0OX0.EIz-kP2e9gTEpyQ3qUQbvt5uSKV8RsTivQ11aVzRtFg';

export const supabase = createClient(supabaseUrl, supabaseKey);