import { describe, it, expect, vi } from 'vitest';

// Mock the supabase client before importing auth-service
vi.mock('../../src/services/supabase-client.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

import { signIn, signOut, getCurrentSession } from '../../src/services/auth-service.js';
import { supabase } from '../../src/services/supabase-client.js';

describe('auth-service', () => {
  it('signIn returns session on success', async () => {
    const mockSession = { user: { email: 'test@example.com' }, access_token: 'tok' };
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null });
    const { session, error } = await signIn('test@example.com', 'pass');
    expect(session).toEqual(mockSession);
    expect(error).toBeNull();
  });

  it('signIn returns error on failure', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: new Error('Invalid login') });
    const { session, error } = await signIn('bad@example.com', 'wrong');
    expect(session).toBeNull();
    expect(error).toBeDefined();
  });

  it('getCurrentSession returns null user when no session', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    const { session, user } = await getCurrentSession();
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('signOut calls supabase signOut', async () => {
    supabase.auth.signOut.mockResolvedValue({});
    await signOut();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});

