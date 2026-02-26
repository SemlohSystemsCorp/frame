import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import crypto from "crypto";

function generateCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export async function POST(request: NextRequest) {
  let body: { username?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { username, email, password } = body;

  if (!username || !email || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = await createClient();

  // Check if username is already taken
  const { data: existingUsername, error: usernameErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (usernameErr) {
    console.error("profiles query error:", usernameErr);
    return NextResponse.json(
      { error: "Database error — have you run supabase/schema.sql? " + usernameErr.message },
      { status: 500 }
    );
  }

  if (existingUsername) {
    return NextResponse.json(
      { error: "That username is already taken.", field: "username" },
      { status: 409 }
    );
  }

  // Check for existing pending verification
  const { data: existingPending, error: pendingErr } = await supabase
    .from("verification_codes")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (pendingErr) {
    console.error("verification_codes query error:", pendingErr);
    return NextResponse.json(
      { error: "Database error — have you run supabase/schema.sql? " + pendingErr.message },
      { status: 500 }
    );
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  if (existingPending) {
    // Refresh the existing code
    await supabase
      .from("verification_codes")
      .update({ code, expires_at: expiresAt, attempts: 0 })
      .eq("email", email);
  } else {
    const { error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        email,
        username: username.toLowerCase(),
        password_hash: password,
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "An account with that email already exists.", field: "email" },
          { status: 409 }
        );
      }
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create verification code: " + insertError.message },
        { status: 500 }
      );
    }
  }

  try {
    await sendEmail(email, username, code);
  } catch (emailErr) {
    console.error("Email send error:", emailErr);
    return NextResponse.json(
      { error: "Failed to send verification email. Check your RESEND_API_KEY." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

async function sendEmail(email: string, username: string, code: string) {
  await resend.emails.send({
    from: "Frame <emails@georgesprojects.com>",
    to: email,
    subject: `Your Frame verification code: ${code}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
        <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px;">Frame</h1>
        <p style="color: #666; margin: 0 0 32px; font-size: 13px;">Verify your email address</p>

        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi <strong>${username}</strong>, here's your verification code:
        </p>

        <div style="background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px; padding: 28px; text-align: center; margin: 0 0 32px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #1a1a1a; font-family: monospace;">
            ${code}
          </span>
          <p style="color: #666; font-size: 13px; margin: 16px 0 0;">
            This code expires in <strong>15 minutes</strong>.
          </p>
        </div>

        <p style="font-size: 13px; color: #999; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
