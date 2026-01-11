import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://typabwoqgjxsqwklkgwv.supabase.co'
const supabaseKey = 'sb_publishable_V88t2EoZPtNXb_sGU7Pucw_ACtLfNGc'

export const supabase = createClient(supabaseUrl, supabaseKey)
