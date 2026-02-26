"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function slugify(val: string) {
  return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export default function CreateCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    display_name: "",
    description: "",
    is_private: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError(null);
  }

  // Auto-slug from display name if user hasn't manually touched name
  function handleDisplayNameChange(val: string) {
    setForm((prev) => ({
      ...prev,
      display_name: val,
      name: slugify(val).slice(0, 21),
    }));
    setFieldErrors((prev) => ({ ...prev, display_name: "", name: "" }));
    setServerError(null);
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    else if (form.name.length < 3) errors.name = "At least 3 characters.";
    else if (form.name.length > 21) errors.name = "21 characters max.";
    else if (!/^[a-z0-9_]+$/.test(form.name)) errors.name = "Lowercase letters, numbers, underscores only.";
    if (!form.display_name.trim()) errors.display_name = "Display name is required.";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setServerError(null);

    const res = await fetch("/api/communities/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.field) {
        setFieldErrors({ [data.field]: data.error });
      } else {
        setServerError(data.error ?? "Something went wrong.");
      }
      return;
    }

    router.push(`/c/${data.name}`);
  }

  return (
    <div className="flex min-h-[80vh] items-start justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-7">
          <Link href="/" className="text-2xl font-bold text-primary">Frame</Link>
          <h1 className="mt-3 text-lg font-semibold">Create a community</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Communities bring people together around ideas, topics, and craft.
          </p>
        </div>

        <div className="rounded border border-border bg-card p-6">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Display name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="display_name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Display Name
              </label>
              <input
                id="display_name"
                type="text"
                placeholder="e.g. Slow Living"
                value={form.display_name}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                className={`rounded border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition ${fieldErrors.display_name ? "border-destructive" : "border-border"}`}
              />
              {fieldErrors.display_name && (
                <p className="text-xs text-destructive">{fieldErrors.display_name}</p>
              )}
            </div>

            {/* URL name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Community URL
              </label>
              <div className="flex items-center rounded border bg-background focus-within:ring-1 focus-within:ring-ring transition overflow-hidden"
                style={{ borderColor: fieldErrors.name ? "var(--destructive)" : "var(--border)" }}
              >
                <span className="px-3 py-2 text-sm text-muted-foreground border-r border-border bg-muted select-none">
                  frame.app/c/
                </span>
                <input
                  id="name"
                  type="text"
                  placeholder="slow_living"
                  value={form.name}
                  onChange={(e) => setField("name", slugify(e.target.value).slice(0, 21))}
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {fieldErrors.name ? (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">3–21 chars. Lowercase, numbers, underscores.</p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                placeholder="What is this community about?"
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="rounded border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition resize-none"
              />
            </div>

            {/* Privacy */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Visibility</p>
              <label className="flex items-center gap-3 cursor-pointer rounded border border-border px-4 py-3 hover:bg-accent transition">
                <input
                  type="radio"
                  name="privacy"
                  checked={!form.is_private}
                  onChange={() => setField("is_private", false)}
                  className="accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">Public</p>
                  <p className="text-xs text-muted-foreground">Anyone can view and join</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer rounded border border-border px-4 py-3 hover:bg-accent transition">
                <input
                  type="radio"
                  name="privacy"
                  checked={form.is_private}
                  onChange={() => setField("is_private", true)}
                  className="accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">Private</p>
                  <p className="text-xs text-muted-foreground">Only approved members can view</p>
                </div>
              </label>
            </div>

            {serverError && (
              <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {serverError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Link
                href="/"
                className="flex-1 text-center rounded border border-border py-2.5 text-sm font-medium hover:bg-accent transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Creating…" : "Create community"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
