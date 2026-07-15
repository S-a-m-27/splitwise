import { createPageMetadata } from "@/app/metadata";
import { AboutPageContent } from "@/features/profile/components/about-page-content";

export const metadata = createPageMetadata(
  "About",
  "App version, build information, and legal links.",
);

export default function AboutPage() {
  return <AboutPageContent />;
}
