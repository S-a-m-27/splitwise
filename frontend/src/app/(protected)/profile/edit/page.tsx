import { createPageMetadata } from "@/app/metadata";
import { EditProfilePageContent } from "@/features/profile/components/edit-profile-page-content";

export const metadata = createPageMetadata(
  "Edit Profile",
  "Update your name and profile photo.",
);

export default function EditProfilePage() {
  return <EditProfilePageContent />;
}
