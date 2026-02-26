"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Search, PlusCircle, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  user: { id: string; email: string } | null;
  username: string | null;
}

export function NavbarClient({ user, username }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <span className="text-xl font-bold tracking-tight text-primary">Frame</span>
        </Link>

        {/* Search */}
        <div className="relative hidden flex-1 max-w-sm md:flex items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search communities…"
            className="w-full rounded border border-border bg-muted py-1.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring transition"
          />
        </div>

        <nav className="hidden md:flex items-center gap-1 ml-auto">
          <Link
            href="/communities"
            className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            Communities
          </Link>

          {user ? (
            <>
              <Link
                href="/create-community"
                className="flex items-center gap-1.5 ml-2 rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
              >
                <PlusCircle className="size-4" />
                Create
              </Link>

              {/* User menu */}
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition"
                >
                  <User className="size-4" />
                  {username ?? "Account"}
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 rounded border border-border bg-card shadow-lg py-1 z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <Link
                      href={`/u/${username}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="size-4" />
                      Profile
                    </Link>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent transition"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="ml-2 px-3 py-1.5 rounded border border-border text-sm font-medium hover:bg-accent transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="ml-1 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="ml-auto md:hidden p-2 rounded text-muted-foreground hover:bg-accent transition"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search communities…"
              className="w-full rounded border border-border bg-muted py-2 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Link href="/communities" className="text-sm py-2 border-b border-border">Communities</Link>
          {user ? (
            <>
              <Link href="/create-community" className="text-sm py-2 border-b border-border">Create Community</Link>
              <Link href={`/u/${username}`} className="text-sm py-2 border-b border-border">Profile</Link>
              <button
                onClick={handleSignOut}
                className="text-left text-sm py-2 text-destructive"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link href="/login" className="flex-1 text-center rounded border border-border py-2 text-sm font-medium">Log in</Link>
              <Link href="/signup" className="flex-1 text-center rounded bg-primary text-primary-foreground py-2 text-sm font-medium">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
