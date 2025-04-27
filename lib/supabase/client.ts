"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

// Criando um cliente Supabase para componentes do lado do cliente
export const createClient = () => {
  return createClientComponentClient<Database>()
}

// Usando o padrão singleton para evitar múltiplas instâncias
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}
