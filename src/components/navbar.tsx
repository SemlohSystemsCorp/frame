import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    username = data?.username ?? null;
  }

  return <NavbarClient user={user ? { id: user.id, email: user.email ?? "" } : null} username={username} />;
}
