"use client";

import { create } from "zustand";
import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js";
import type { UserProfile } from "../types";

interface AuthStore {
    user: SupabaseUser | null;
    profile: UserProfile | null;
    session: SupabaseSession | null;
    isLoading: boolean;
    initialized: boolean;
    setAuth: (session: SupabaseSession | null, user: SupabaseUser | null, profile: UserProfile | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    setLoading: (isLoading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    initialized: false,
    setAuth: (session, user, profile) =>
        set({ session, user, profile, isLoading: false, initialized: true }),
    setProfile: (profile) => set({ profile }),
    setLoading: (isLoading) => set({ isLoading }),
    setInitialized: (initialized) => set({ initialized }),
    clearAuth: () => set({ session: null, user: null, profile: null, isLoading: false, initialized: true }),
}));
export type { AuthStore };
