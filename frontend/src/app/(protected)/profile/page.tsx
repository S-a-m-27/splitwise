import { createPageMetadata } from "@/app/metadata";
import { ProfilePageContent } from "@/features/profile/components/profile-page-content";

export const metadata = createPageMetadata(
  "Profile",
  "Manage your account, preferences, and activity overview.",
);

export default function ProfilePage() {
  return <ProfilePageContent />;
}
