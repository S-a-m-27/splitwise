import { APP_CONFIG } from "@/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto w-full max-w-[430px] px-4 py-4 sm:max-w-none">
        <p className="text-center text-xs text-muted-foreground">
          &copy; {year} {APP_CONFIG.name}
        </p>
      </div>
    </footer>
  );
}
