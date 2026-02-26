"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("signup_email");
    if (!stored) {
      router.replace("/signup");
      return;
    }
    setEmail(stored);
    // Focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(null);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (char && index === 5 && next.every((d) => d !== "")) {
      submitCode(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      const next = pasted.split("");
      setDigits(next);
      inputRefs.current[5]?.focus();
      submitCode(pasted);
    }
  }

  async function submitCode(code: string) {
    if (!email) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      if (data.expired) {
        sessionStorage.removeItem("signup_email");
        setTimeout(() => router.push("/signup"), 2500);
      }
      // Clear digits on wrong code
      if (res.status === 400) {
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
      return;
    }

    setSuccess(true);
    sessionStorage.removeItem("signup_email");
    setTimeout(() => router.push(data.redirect ?? "/"), 1500);
  }

  async function handleResend() {
    if (!email || resendCooldown > 0) return;
    setResending(true);
    setError(null);

    // We re-use the signup route which refreshes the code
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username: "resend", password: "resend" }),
    });

    setResending(false);
    if (res.ok) {
      setResendCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-1">You&apos;re in!</h1>
          <p className="text-muted-foreground">Taking you home…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            Frame
          </Link>
          <h1 className="mt-3 text-xl font-semibold">Check your email</h1>
          {email && (
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          )}
        </div>

        <div className="rounded border border-border bg-card p-8 shadow-sm">
          <p className="text-sm text-center text-muted-foreground mb-6">
            Enter the code below. It expires in 15 minutes.
          </p>

          {/* 6-digit input */}
          <div
            className="flex gap-3 justify-center mb-6"
            onPaste={handlePaste}
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                aria-label={`Digit ${i + 1}`}
                className={`w-12 h-14 text-center text-xl font-bold rounded border-2 bg-background outline-none transition focus:border-primary focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                  error ? "border-destructive" : digit ? "border-primary" : "border-border"
                }`}
              />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center mb-4">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center mb-4">{error}</p>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="font-medium text-primary hover:underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
              >
                {resending
                  ? "Sending…"
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-4" />
            Back to sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
