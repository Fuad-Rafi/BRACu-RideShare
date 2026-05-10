import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  name: string | null;
  department: string | null;
  student_id: string | null;
  gender: string | null;
  avatar_url: string | null;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  fetchProfile: async (userId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      set({ profile: data, loading: false });
    } else {
      set({ loading: false });
    }
  },
  updateProfile: async (updates) => {
    const profile = get().profile;
    if (!profile) return { error: 'No profile loaded' };

    set({ loading: true });
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (!error) {
      set({ profile: { ...profile, ...updates }, loading: false });
    } else {
      set({ loading: false });
    }
    return { error };
  },
}));
