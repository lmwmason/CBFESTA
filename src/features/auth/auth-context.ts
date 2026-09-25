import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Tables } from '../../lib/supabase/database.types';

export type FestivalRole = 'owner' | 'admin' | 'staff' | 'booth_operator' | 'participant';
export type Membership = Tables<'festival_members'> & { festivals: Tables<'festivals'> | null };
export type AuthValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  memberships: Membership[];
  activeMembership: Membership | null;
  activeRoles: FestivalRole[];
  setActiveFestival: (festivalId: number) => void;
  signIn: (id: string, password: string) => Promise<void>;
  signUp: (details: { id: string; password: string; name: string; studentNumber: string; accountType: 'student' | 'teacher' }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  updateAccount: (values: {
    name?: string;
    password?: string;
    avatarUrl?: string;
  }) => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }
