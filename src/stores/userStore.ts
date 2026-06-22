import { create } from 'zustand';

export type SubscriptionStatus = 'active' | 'pending' | 'expired';

export interface UserProfile {
  id: string;
  fullName: string;
  businessName: string;
  phoneNumber: string;
  email: string;
  whatsappNumber: string;
  storeSlug: string;
  subscriptionStatus: SubscriptionStatus;
  logoUrl?: string;
  description?: string;
}

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  clearUser: () => set({ user: null }),
}));
