/**
 * Auth service — wraps Supabase Auth.
 * When supabase is null (offline/demo mode) all calls resolve as unauthenticated.
 */
import { supabase } from './supabase-client.js';

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{session, error}>}
 */
export async function signIn(email, password) {
  if (!supabase) return { session: null, error: new Error('Offline mode: Supabase not configured.') };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { session: data?.session ?? null, error };
}

/** @returns {Promise<void>} */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * @returns {Promise<{session, user}>}
 */
export async function getCurrentSession() {
  if (!supabase) return { session: null, user: null };
  const { data } = await supabase.auth.getSession();
  return { session: data?.session ?? null, user: data?.session?.user ?? null };
}

/**
 * Subscribe to auth state changes.
 * @param {(event:string, session:object|null)=>void} callback
 * @returns {()=>void} unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

