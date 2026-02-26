"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  agree?: string;
}

function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-border",
  "bg-destructive",
  "bg-amber-500",
  "bg-yellow-400",
  "bg-green-500",
];

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    agree: false,
  });

  function setField(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!form.username.trim()) {
      errors.username = "Username is required.";
    } else if (form.username.length < 3) {
      errors.username = "Username must be at least 3 characters.";
    } else if (form.username.length > 20) {
      errors.username = "Username must be 20 characters or fewer.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      errors.username = "Letters, numbers, and underscores only.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!form.agree) {
      errors.agree = "You must agree to continue.";
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setServerError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.field) {
        setFieldErrors({ [data.field]: data.error });
      } else {
        setServerError(data.error ?? "Something went wrong. Please try again.");
      }
      return;
    }

    sessionStorage.setItem("signup_email", form.email.trim().toLowerCase());
    router.push("/signup/verify");
  }

  const strength = form.password.length > 0 ? passwordStrength(form.password) : -1;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            Frame
          </Link>
          <h1 className="mt-3 text-xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join thousands of curious minds.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="your_handle"
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                aria-invalid={!!fieldErrors.username}
                className={`rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition ${
                  fieldErrors.username ? "border-destructive" : "border-border"
                }`}
              />
              {fieldErrors.username ? (
                <p className="text-xs text-destructive">{fieldErrors.username}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  3–20 characters. Letters, numbers, underscores only.
                </p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                aria-invalid={!!fieldErrors.email}
                className={`rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition ${
                  fieldErrors.email ? "border-destructive" : "border-border"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  aria-invalid={!!fieldErrors.password}
                  className={`w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition ${
                    fieldErrors.password ? "border-destructive" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {strength >= 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength ? STRENGTH_COLORS[strength] : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs ${
                      strength <= 1
                        ? "text-destructive"
                        : strength <= 2
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            {/* Agree */}
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => setField("agree", e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to Frame&apos;s{" "}
                  <Link
                    href="/terms"
                    className="text-primary underline underline-offset-2"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {fieldErrors.agree && (
                <p className="text-xs text-destructive ml-7">{fieldErrors.agree}</p>
              )}
            </div>

            {serverError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Sending code…" : "Continue"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline underline-offset-2"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
