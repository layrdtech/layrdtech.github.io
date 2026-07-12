import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const isDatabaseConfigured = () => Boolean(supabaseClient)

export const saveSubmissionToDatabase = async (type, payload) => {
  if (!supabaseClient) {
    return { ok: false, reason: 'not-configured' }
  }

  const { error } = await supabaseClient.from('submissions').insert([
    {
      type,
      payload,
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    console.error('Database insert failed:', error)
    return { ok: false, reason: error.message }
  }

  return { ok: true }
}
