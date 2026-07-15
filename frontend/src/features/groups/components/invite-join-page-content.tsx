"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { groupDetailRoute, ROUTES } from "@/constants/routes";
import { AuthGateLoader } from "@/features/auth/components/auth-gate-loader";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { buildLoginRedirectUrl } from "@/lib/safe-redirect";
import { useJoinGroup } from "@/features/groups/hooks/use-groups";
import { getGroupsErrorMessage } from "@/features/groups/services/groups.errors";

interface InviteJoinPageContentProps {
  inviteCode: string;
}

export function InviteJoinPageContent({ inviteCode }: InviteJoinPageContentProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { mutate: joinGroup, isPending } = useJoinGroup();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(buildLoginRedirectUrl(`/invite/${inviteCode}`));
      return;
    }

    if (attemptedRef.current || isPending) return;
    attemptedRef.current = true;

    joinGroup(inviteCode, {
      onSuccess: (groupId) => {
        toast.success("You joined the group!");
        router.replace(groupDetailRoute(groupId));
      },
      onError: (error) => {
        toast.error(getGroupsErrorMessage(error));
        router.replace(ROUTES.groups);
      },
    });
  }, [inviteCode, isAuthenticated, isLoading, isPending, joinGroup, router]);

  return <AuthGateLoader message="Joining group…" />;
}
