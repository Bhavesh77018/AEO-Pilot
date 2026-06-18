/** Supabase env, read in one place. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Whether Supabase is wired. When false the app runs fully open (no auth gate)
 * — preserving the "works with zero config" principle for local/demo use.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
