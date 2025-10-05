import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://efalapfhgteyasrjcyis.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYWxhcGZoZ3RleWFzcmpjeWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODE3OTUsImV4cCI6MjA3MTU1Nzc5NX0.FRht63PPd1gCgBbtnU67B2P9dz8lMgpKzdcCUPb3pcA'

export const supabase = createClient(supabaseUrl, supabaseKey)