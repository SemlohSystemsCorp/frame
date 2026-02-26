"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, Bell, PlusCircle } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <span className="text-xl font-bold tracking-tight text-primary">
            Frame
          </span>
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
          <Link
            href="/popular"
            className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            Popular
          </Link>
          <button
            aria-label="Notifications"
            className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <Bell className="size-4" />
          </button>
          <Link
            href="/submit"
            className="flex items-center gap-1.5 ml-2 rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            <PlusCircle className="size-4" />
            Post
          </Link>
          <Link
            href="/login"
            className="ml-2 px-3 py-1.5 rounded border border-border text-sm font-medium hover:bg-accent transition"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="ml-1 px-3 py-1.5 rounded bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
          >
            Sign up
          </Link>
        </nav>

        <button
          className="ml-auto md:hidden p-2 rounded text-muted-foreground hover:bg-accent transition"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

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
          <Link href="/popular" className="text-sm py-2 border-b border-border">Popular</Link>
          <Link href="/submit" className="text-sm py-2 border-b border-border">Create Post</Link>
          <div className="flex gap-2 pt-1">
            <Link href="/login" className="flex-1 text-center rounded border border-border py-2 text-sm font-medium">Log in</Link>
            <Link href="/signup" className="flex-1 text-center rounded bg-primary text-primary-foreground py-2 text-sm font-medium">Sign up</Link>
          </div>
        </div>
      )}
    </header>
  );
}
