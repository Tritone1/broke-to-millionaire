import type { Session, User } from '@supabase/supabase-js';

import { getSupabaseClient, requireSupabaseClient } from './supabaseClient';

export type BackendSessionResult =
  | { status: 'ready'; session: Session; user: User }
  | { status: 'unconfigured' };

export async function ensureGuestSession(): Promise<BackendSessionResult> {
  const client = getSupabaseClient();
  if (!client) return { status: 'unconfigured' };

  const { data: current, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (current.session) {
    return { status: 'ready', session: current.session, user: current.session.user };
  }

  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  if (!data.session || !data.user) throw new Error('Supabase did not return an anonymous session.');
  return { status: 'ready', session: data.session, user: data.user };
}

export async function linkGuestToEmail(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
  if (password.length < 8) throw new Error('Password must contain at least 8 characters.');

  const client = requireSupabaseClient();
  const { data, error } = await client.auth.updateUser({ email: normalizedEmail, password });
  if (error) throw error;
  return data.user;
}

export async function signInWithEmail(email: string, password: string): Promise<Session> {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function signOutBackend(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function deleteBackendAccount(): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.functions.invoke('account-delete', { method: 'POST' });
  if (error) throw error;
  await client.auth.signOut();
}
