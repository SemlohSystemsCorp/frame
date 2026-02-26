import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  // Check auth first
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  let body: {
    name?: string;
    display_name?: string;
    description?: string;
    is_private?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, display_name, description, is_private = false } = body;

  if (!name || !display_name) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const cleanName = name.toLowerCase().trim();

  if (cleanName.length < 3 || cleanName.length > 21) {
    return NextResponse.json(
      { error: "Name must be 3–21 characters.", field: "name" },
      { status: 400 }
    );
  }
  if (!/^[a-z0-9_]+$/.test(cleanName)) {
    return NextResponse.json(
      { error: "Lowercase letters, numbers, underscores only.", field: "name" },
      { status: 400 }
    );
  }

  // Get the user's profile
  const admin = adminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // Create the community
  const { data: community, error: communityError } = await admin
    .from("communities")
    .insert({
      name: cleanName,
      display_name: display_name.trim(),
      description: description?.trim() || null,
      is_private,
      owner_id: user.id,
    })
    .select("id, name")
    .single();

  if (communityError) {
    if (communityError.code === "23505") {
      return NextResponse.json(
        { error: "That community name is already taken.", field: "name" },
        { status: 409 }
      );
    }
    console.error("Community insert error:", communityError);
    return NextResponse.json(
      { error: "Failed to create community." },
      { status: 500 }
    );
  }

  // Auto-join the creator as owner
  await admin.from("community_members").insert({
    community_id: community.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json({ ok: true, name: community.name });
}
