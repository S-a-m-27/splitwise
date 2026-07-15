import { APP_CONFIG } from "@/constants";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-[430px] items-center px-4 sm:max-w-none">
        <span className="text-sm font-semibold">{APP_CONFIG.name}</span>
      </div>
    </header>
  );
}
