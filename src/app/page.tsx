import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Flame, Clock, Star, PlusCircle, Users } from "lucide-react";

const FEED_TABS = [
  { label: "Hot", icon: Flame, sort: "hot" },
  { label: "New", icon: Clock, sort: "new" },
  { label: "Top", icon: TrendingUp, sort: "top" },
  { label: "Rising", icon: Star, sort: "rising" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort = "hot" } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load profile if logged in
  let profile: { username: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  // Load posts
  const orderCol = sort === "new" ? "created_at" : "vote_count";
  const { data: posts } = await supabase
    .from("posts")
    .select(
      `id, title, body, url, image_url, flair, vote_count, comment_count, created_at,
       communities(name, display_name),
       profiles(username)`
    )
    .order(orderCol, { ascending: false })
    .limit(30);

  // Load trending communities
  const { data: trending } = await supabase
    .from("communities")
    .select("name, display_name, member_count")
    .order("member_count", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex gap-6 items-start">
        {/* Feed */}
        <section className="flex-1 min-w-0">
          {/* Sort tabs */}
          <div className="mb-4 flex items-center gap-1 rounded border border-border bg-card p-1">
            {FEED_TABS.map((tab) => (
              <Link
                key={tab.label}
                href={`/?sort=${tab.sort}`}
                className={`flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium transition ${
                  sort === tab.sort
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Posts or empty state */}
          {posts && posts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {posts.map((post) => {
                const community = post.communities as unknown as { name: string; display_name: string } | null;
                const author = post.profiles as unknown as { username: string } | null;
                return (
                  <article
                    key={post.id}
                    className="group rounded border border-border bg-card hover:border-ring/50 transition"
                  >
                    {/* Vote column */}
                    <div className="flex">
                      <div className="flex flex-col items-center gap-1 px-3 py-3 text-muted-foreground">
                        <button className="hover:text-primary transition text-lg leading-none">▲</button>
                        <span className="text-xs font-bold text-foreground">
                          {formatCount(post.vote_count)}
                        </span>
                        <button className="hover:text-destructive transition text-lg leading-none">▼</button>
                      </div>

                      <div className="flex-1 min-w-0 py-3 pr-4">
                        {/* Meta */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 flex-wrap">
                          {community && (
                            <Link
                              href={`/c/${community.name}`}
                              className="font-semibold text-foreground hover:underline"
                            >
                              c/{community.name}
                            </Link>
                          )}
                          <span>·</span>
                          <span>Posted by u/{author?.username ?? "[deleted]"}</span>
                          <span>·</span>
                          <span>{timeAgo(post.created_at)}</span>
                          {post.flair && (
                            <>
                              <span>·</span>
                              <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">
                                {post.flair}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <Link href={`/post/${post.id}`}>
                          <h2 className="text-sm font-semibold leading-snug group-hover:text-primary transition mb-1">
                            {post.title}
                          </h2>
                        </Link>

                        {/* Body preview */}
                        {post.body && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {post.body}
                          </p>
                        )}

                        {/* Image */}
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt=""
                            className="rounded mb-2 max-h-72 w-full object-cover"
                          />
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Link
                            href={`/post/${post.id}`}
                            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent hover:text-foreground transition"
                          >
                            💬 {formatCount(post.comment_count)} comments
                          </Link>
                          <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent hover:text-foreground transition">
                            Share
                          </button>
                          {user && (
                            <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent hover:text-foreground transition">
                              Save
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded border border-dashed border-border bg-card">
              <Users className="size-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-1">Nothing here yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Be the first. Create a community and start the conversation.
              </p>
              {user ? (
                <Link
                  href="/create-community"
                  className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                >
                  <PlusCircle className="size-4" />
                  Create a community
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/signup"
                    className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/login"
                    className="rounded border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition"
                  >
                    Log in
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          {/* Auth card — changes based on login state */}
          {user && profile ? (
            <div className="rounded border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground mb-1">Logged in as</p>
              <p className="font-bold mb-4">u/{profile.username}</p>
              <Link
                href="/create-community"
                className="flex items-center justify-center gap-2 w-full rounded bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                <PlusCircle className="size-4" />
                Create community
              </Link>
            </div>
          ) : (
            <div className="rounded border border-border bg-card p-5">
              <h2 className="font-bold text-base mb-1">Welcome to Frame</h2>
              <p className="text-sm text-muted-foreground mb-4">
                A calm, thoughtful place for communities built around ideas,
                craft, and curiosity.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/signup"
                  className="w-full text-center rounded bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="w-full text-center rounded border border-border py-2 text-sm font-medium hover:bg-accent transition"
                >
                  Log in
                </Link>
              </div>
            </div>
          )}

          {/* Trending communities */}
          {trending && trending.length > 0 && (
            <div className="rounded border border-border bg-card p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                <TrendingUp className="size-4 text-primary" />
                Trending Communities
              </h3>
              <ul className="flex flex-col gap-1">
                {trending.map((c, i) => (
                  <li key={c.name}>
                    <Link
                      href={`/c/${c.name}`}
                      className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-accent transition group"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-4 text-xs">{i + 1}</span>
                        <span className="font-medium group-hover:text-primary transition">
                          c/{c.name}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCount(c.member_count)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
            {["Privacy", "Terms", "Help", "About"].map((l) => (
              <Link
                key={l}
                href={`/${l.toLowerCase()}`}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                {l}
              </Link>
            ))}
            <span className="text-xs text-muted-foreground">© 2026 Frame</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
