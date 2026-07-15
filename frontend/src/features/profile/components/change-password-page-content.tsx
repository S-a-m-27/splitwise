"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { PageStack } from "@/components/layout/page-layout";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { PasswordForm } from "@/features/profile/components/password-form";
import { ProfileBackHeader } from "@/features/profile/components/profile-back-header";
import { useChangePassword } from "@/features/profile/hooks/use-profile";
import { getProfileErrorMessage } from "@/features/profile/services/profile.errors";
import type { PasswordFormValues } from "@/features/profile/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function ChangePasswordPageContent() {
  const router = useRouter();
  const changePassword = useChangePassword();

  function handleSubmit(values: PasswordFormValues) {
    changePassword.mutate(values, {
      onSuccess: () => {
        toast.success("Password updated", {
          description: "Your new password is now active.",
        });
        router.push(ROUTES.profile);
      },
      onError: (error) => toast.error(getProfileErrorMessage(error)),
    });
  }

  return (
    <DashboardShell>
      <PageStack>
        <ProfileBackHeader title="Change password" backHref={ROUTES.profile} />

        <p className={cn("leading-relaxed", META_TEXT_CLASS)}>
          Use a strong password with at least 8 characters.
        </p>

        <PasswordForm onSubmit={handleSubmit} isSubmitting={changePassword.isPending} />
      </PageStack>
    </DashboardShell>
  );
}
