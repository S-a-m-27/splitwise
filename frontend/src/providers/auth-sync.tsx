"use client";

import { useInitializeAuth } from "@/features/auth";
import type { ReactNode } from "react";

interface AuthSyncProps {
    children: ReactNode;
}

export function AuthSync({ children }: AuthSyncProps) {
    useInitializeAuth();
    return <>{children}</>;
}
