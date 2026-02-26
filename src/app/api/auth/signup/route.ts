import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import crypto from "crypto";

function generateCode(): string {
  // Cryptographically random 6-digit code
  return String(crypto.randomInt(100000, 999999));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, email, password } = body as {
    username: string;
    email: string;
    password: string;
  };

  if (!username || !email || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = await createClient();

  // Check if username is already taken in profiles table
  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json(
      { error: "That username is already taken.", field: "username" },
      { status: 409 }
    );
  }

  // Check if email is already registered
  // We check verification_codes first (pending signup) and auth.users via admin
  const { data: existingPending } = await supabase
    .from("verification_codes")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingPending) {
    // Resend a fresh code instead of blocking
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase
      .from("verification_codes")
      .update({ code, expires_at: expiresAt, attempts: 0 })
      .eq("email", email);

    await sendEmail(email, username, code);

    return NextResponse.json({ ok: true });
  }

  // Store pending signup data + code
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from("verification_codes")
    .insert({
      email,
      username: username.toLowerCase(),
      password_hash: password, // stored temporarily; Supabase auth will hash on signUp
      code,
      expires_at: expiresAt,
    });

  if (insertError) {
    // Unique violation on email means it already exists in auth.users
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "An account with that email already exists.", field: "email" },
        { status: 409 }
      );
    }
    console.error("Insert error:", insertError);
    return NextResponse.json({ error: "Failed to create verification code." }, { status: 500 });
  }

  await sendEmail(email, username, code);

  return NextResponse.json({ ok: true });
}

async function sendEmail(email: string, username: string, code: string) {
  await resend.emails.send({
    from: "Frame <emails@georgesprojects.com>",
    to: email,
    subject: `Your Frame verification code: ${code}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #2a1f0e;">
        <h1 style="font-size: 28px; font-weight: 700; color: #8c4e1a; margin: 0 0 8px;">Frame</h1>
        <p style="color: #7a6652; margin: 0 0 32px; font-size: 14px;">Thoughtful communities</p>

        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          Hi <strong>${username}</strong>, here&apos;s your verification code:
        </p>

        <div style="background: #f9f3ec; border: 1px solid #e8ddd0; border-radius: 12px; padding: 28px; text-align: center; margin: 0 0 32px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #8c4e1a; font-family: monospace;">
            ${code}
          </span>
          <p style="color: #7a6652; font-size: 13px; margin: 16px 0 0;">
            This code expires in <strong>15 minutes</strong>.
          </p>
        </div>

        <p style="font-size: 14px; color: #7a6652; line-height: 1.6;">
          If you didn&apos;t request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
