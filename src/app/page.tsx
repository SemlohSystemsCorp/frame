import Link from "next/link";
import { PostCard, type Post } from "@/components/post-card";
import { TrendingUp, Flame, Star, Clock } from "lucide-react";

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    title: "The quiet joy of analog hobbies in a hyper-connected world",
    body: "There's something deeply satisfying about putting pen to paper, kneading bread dough, or shaping clay with your hands. I've been reflecting on why these activities feel so different from scrolling, and I think it comes down to texture — both literal and metaphorical.",
    community: "slowliving",
    author: "maren_k",
    votes: 4821,
    commentCount: 312,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    flair: "Discussion",
  },
  {
    id: "2",
    title: "Show Frame: I built a command-line tool to batch-rename files by EXIF date",
    body: "After years of photo directories named IMG_4523.jpg I finally snapped. Here's the 80-line Python script that saved my sanity — happy to open-source it if there's interest.",
    community: "programming",
    author: "devtoolsmith",
    votes: 2140,
    commentCount: 98,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    flair: "Show & Tell",
  },
  {
    id: "3",
    title: "Scientists discover that soil microbiomes communicate via chemical gradients in ways previously thought impossible",
    community: "science",
    author: "dr_esther_v",
    votes: 18200,
    commentCount: 740,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    flair: "Research",
  },
  {
    id: "4",
    title: "Weekly thread: What book changed how you see the world?",
    body: "Mine was Gödel, Escher, Bach. It rewired the way I think about recursion, consciousness, and meaning. Still processing it ten years later.",
    community: "books",
    author: "paperweight_co",
    votes: 932,
    commentCount: 421,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    flair: "Weekly Thread",
  },
  {
    id: "5",
    title: "Homemade miso from scratch — 18-month ferment finally ready",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
    community: "fermentation",
    author: "umami_lab",
    votes: 7430,
    commentCount: 203,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
];

const TRENDING_COMMUNITIES = [
  { name: "slowliving", members: "128k" },
  { name: "fermentation", members: "94k" },
  { name: "programming", members: "2.1M" },
  { name: "science", members: "3.4M" },
  { name: "books", members: "780k" },
];

const FEED_TABS = [
  { label: "Hot", icon: Flame, href: "/?sort=hot" },
  { label: "New", icon: Clock, href: "/?sort=new" },
  { label: "Top", icon: TrendingUp, href: "/?sort=top" },
  { label: "Rising", icon: Star, href: "/?sort=rising" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex gap-6 items-start">
        {/* Feed */}
        <section className="flex-1 min-w-0">
          {/* Sort tabs */}
          <div className="mb-4 flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            {FEED_TABS.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition first:bg-accent first:text-foreground"
              >
                <tab.icon className="size-4" />
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Post list */}
          <div className="flex flex-col gap-3">
            {MOCK_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          {/* Welcome card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-bold text-base mb-1">Welcome to Frame</h2>
            <p className="text-sm text-muted-foreground mb-4">
              A calm, thoughtful place for communities built around ideas,
              craft, and curiosity.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/signup"
                className="w-full text-center rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="w-full text-center rounded-full border border-border py-2 text-sm font-medium hover:bg-accent transition"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Trending communities */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
              <TrendingUp className="size-4 text-primary" />
              Trending Communities
            </h3>
            <ul className="flex flex-col gap-2">
              {TRENDING_COMMUNITIES.map((c, i) => (
                <li key={c.name}>
                  <Link
                    href={`/c/${c.name}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent transition group"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-4 text-xs">
                        {i + 1}
                      </span>
                      <span className="font-medium group-hover:text-primary transition">
                        c/{c.name}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.members}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
            {["Help", "About", "Careers", "Privacy", "Terms", "Rules"].map(
              (l) => (
                <Link
                  key={l}
                  href={`/${l.toLowerCase()}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition"
                >
                  {l}
                </Link>
              )
            )}
            <span className="text-xs text-muted-foreground">
              © 2025 Frame
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
