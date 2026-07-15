import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4 sm:max-w-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
