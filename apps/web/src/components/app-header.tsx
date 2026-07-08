import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Folder, LogIn } from "react-feather";
import { ThemeToggle } from "@/components/theme-toggle";

/** Rendered once in the root layout so every page — marketing home, projects list, project detail — gets the same navigation instead of each page hand-rolling its own. */
export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
        LogoAI
      </Link>
      <div className="flex items-center gap-2">
        <Show when="signed-in">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Folder size={16} />
            Projects
          </Link>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <LogIn size={16} />
              Sign in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
        <ThemeToggle />
      </div>
    </header>
  );
}
