import { createPageMetadata } from "@/app/metadata";
import { ChangePasswordPageContent } from "@/features/profile/components/change-password-page-content";

export const metadata = createPageMetadata(
  "Change Password",
  "Update your account password.",
);

export default function ChangePasswordPage() {
  return <ChangePasswordPageContent />;
}
