import type { Metadata } from "next";
import { AuthLayout, LoginForm } from "@/features/auth";
import { APP_CONFIG } from "@/constants/config";

export const metadata: Metadata = {
    title: `Sign In — ${APP_CONFIG.name}`,
    description: `Sign in to your ${APP_CONFIG.name} account to split expenses, track balances, and settle debts.`,
};

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your account to manage your split bills"
        >
            <LoginForm />
        </AuthLayout>
    );
}
