import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, code } = body;

  if (!email || !code) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = adminClient();

  const { data: record, error: fetchError } = await supabase
    .from("verification_codes")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (fetchError) {
    console.error("verification_codes fetch error:", fetchError);
    return NextResponse.json({ error: "Database error." }, { status: 500 });
  }

  if (!record) {
    return NextResponse.json(
      { error: "No pending signup found for this email." },
      { status: 404 }
    );
  }

  // Check expiry
  if (new Date(record.expires_at) < new Date()) {
    await supabase.from("verification_codes").delete().eq("email", email);
    return NextResponse.json(
      { error: "Your code has expired. Please sign up again.", expired: true },
      { status: 410 }
    );
  }

  // Track attempts
  if (record.attempts >= 5) {
    await supabase.from("verification_codes").delete().eq("email", email);
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please sign up again.", expired: true },
      { status: 429 }
    );
  }

  if (record.code !== code.trim()) {
    await supabase
      .from("verification_codes")
      .update({ attempts: record.attempts + 1 })
      .eq("email", email);

    const remaining = 5 - (record.attempts + 1);
    return NextResponse.json(
      { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
      { status: 400 }
    );
  }

  // Code is correct — create the Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: record.email,
    password: record.password_hash,
    email_confirm: true,
    user_metadata: { username: record.username },
  });

  if (authError) {
    if (authError.message?.includes("already registered")) {
      await supabase.from("verification_codes").delete().eq("email", email);
      return NextResponse.json(
        { error: "An account with that email already exists.", field: "email" },
        { status: 409 }
      );
    }
    console.error("Auth createUser error:", authError);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }

  // Create profile row
  if (authData.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      username: record.username,
      email: record.email,
    });
    if (profileError) {
      console.error("Profile insert error:", profileError);
    }
  }

  // Delete the verification code — it's been used
  await supabase.from("verification_codes").delete().eq("email", email);

  // Sign the user in
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: record.email,
    password: record.password_hash,
  });

  if (sessionError || !sessionData.session) {
    // Account created but couldn't auto-login — send to login page
    return NextResponse.json({ ok: true, redirect: "/login" });
  }

  return NextResponse.json({ ok: true, redirect: "/" });
}
