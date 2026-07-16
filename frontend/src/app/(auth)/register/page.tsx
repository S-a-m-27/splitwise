import type { Metadata } from "next";
import { AuthLayout, RegisterForm } from "@/features/auth";
import { APP_CONFIG } from "@/constants/config";

export const metadata: Metadata = {
    title: `Create Account — ${APP_CONFIG.name}`,
    description: `Create a new ${APP_CONFIG.name} account to start splitting expenses with friends, family, and roommates.`,
};

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Create Account"
            subtitle="Sign up for a new account to start tracking shared expenses"
        >
            <RegisterForm />
        </AuthLayout>
    );
}
