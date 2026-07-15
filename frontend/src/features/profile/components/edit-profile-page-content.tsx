"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { PageStack } from "@/components/layout/page-layout";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ProfileBackHeader } from "@/features/profile/components/profile-back-header";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { ProfileHeaderSkeleton } from "@/features/profile/components/profile-skeleton";
import { useProfile, useUpdateProfile } from "@/features/profile/hooks/use-profile";
import { getProfileErrorMessage } from "@/features/profile/services/profile.errors";
import type { ProfileFormValues } from "@/features/profile/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function EditProfilePageContent() {
  const router = useRouter();
  const { data: profile, isLoading, isError, errorMessage, refetch } = useProfile();
  const updateProfile = useUpdateProfile();

  function handleSubmit(values: ProfileFormValues) {
    updateProfile.mutate(values, {
      onSuccess: (updated) => {
        toast.success("Profile updated", {
          description: `Saved as "${updated.fullName}".`,
        });
        router.push(ROUTES.profile);
      },
      onError: (error) => toast.error(getProfileErrorMessage(error)),
    });
  }

  return (
    <DashboardShell>
      <PageStack>
        <ProfileBackHeader title="Edit profile" backHref={ROUTES.profile} />

        <p className={cn("leading-relaxed", META_TEXT_CLASS)}>
          Update how your name appears across groups and expenses.
        </p>

        {isLoading ? (
          <ProfileHeaderSkeleton />
        ) : isError || !profile ? (
          <DashboardErrorState
            message={errorMessage ?? "Could not load profile."}
            onRetry={() => void refetch()}
          />
        ) : (
          <ProfileForm
            key={profile.id}
            profile={profile}
            onSubmit={handleSubmit}
            isSubmitting={updateProfile.isPending}
          />
        )}
      </PageStack>
    </DashboardShell>
  );
}
