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
const STRENGTH_COLORS = ["bg-border", "bg-destructive", "bg-amber-500", "bg-yellow-400", "bg-green-500"];

const GitHubIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

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
      errors.username = "At least 3 characters.";
    } else if (form.username.length > 20) {
      errors.username = "20 characters max.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      errors.username = "Letters, numbers, underscores only.";
    }
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email.";
    }
    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 8) {
      errors.password = "At least 8 characters.";
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
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            Frame
          </Link>
          <h1 className="mt-3 text-lg font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join thoughtful communities.</p>
        </div>

        <div className="rounded border border-border bg-card p-6">
          {/* GitHub OAuth */}
          <a
            href="/api/auth/github"
            className="flex w-full items-center justify-center gap-2 rounded border border-border bg-[#24292e] py-2.5 text-sm font-medium text-white hover:bg-[#2f363d] transition mb-5"
          >
            <GitHubIcon />
            Sign up with GitHub
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="your_handle"
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                className={`rounded border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition ${fieldErrors.username ? "border-destructive" : "border-border"}`}
              />
              {fieldErrors.username ? (
                <p className="text-xs text-destructive">{fieldErrors.username}</p>
              ) : (
                <p className="text-xs text-muted-foreground">3–20 chars. Letters, numbers, underscores.</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={`rounded border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition ${fieldErrors.email ? "border-destructive" : "border-border"}`}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                  className={`w-full rounded border bg-background px-3 py-2 pr-9 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition ${fieldErrors.password ? "border-destructive" : "border-border"}`}
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
                      <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors ${i <= strength ? STRENGTH_COLORS[strength] : "bg-border"}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${strength <= 1 ? "text-destructive" : strength <= 2 ? "text-amber-500" : "text-green-500"}`}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
              {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
            </div>

            {/* Agree */}
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => setField("agree", e.target.checked)}
                  className="mt-0.5 size-3.5 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to Frame&apos;s{" "}
                  <Link href="/terms" className="text-primary underline underline-offset-2">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link>.
                </span>
              </label>
              {fieldErrors.agree && <p className="text-xs text-destructive ml-6">{fieldErrors.agree}</p>}
            </div>

            {serverError && (
              <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Sending code…" : "Continue"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
