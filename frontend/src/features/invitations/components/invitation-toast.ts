import { toast } from "sonner";

/** Toast helpers for invitation UX feedback. */
export const invitationToast = {
  sent(displayName?: string) {
    toast.success("Invitation sent", {
      description: displayName
        ? `We sent an invite to ${displayName}.`
        : "The invitation has been queued for delivery.",
    });
  },
  cancelled() {
    toast.success("Invitation cancelled");
  },
  accepted(groupName: string) {
    toast.success("Invitation accepted", {
      description: `You've joined ${groupName}.`,
    });
  },
  declined() {
    toast.success("Invitation declined");
  },
  resent() {
    toast.info("Reminder sent", {
      description: "Resend will connect to email delivery in a future update.",
    });
  },
  error(message?: string) {
    toast.error(message ?? "Something went wrong with the invitation.");
  },
};
