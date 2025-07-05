// Supabase client disabled - using custom auth instead
// All Supabase functionality has been commented out

/*
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signIn: async () => ({ data: null, error: new Error('Not implemented') }),
    signOut: async () => ({ data: null, error: new Error('Not implemented') }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  })
}

export function createSupabaseClient() {
  return supabase
}
*/

export type Database = any
export type Tables<T extends string> = any
export type InsertTables<T extends string> = any
export type UpdateTables<T extends string> = any
export type Enums<T extends string> = any