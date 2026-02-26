"use client";

import Link from "next/link";
import { ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark } from "lucide-react";
import { useState } from "react";
import { cn, timeAgo, formatCount } from "@/lib/utils";

export interface Post {
  id: string;
  title: string;
  body?: string;
  image?: string;
  community: string;
  author: string;
  votes: number;
  commentCount: number;
  createdAt: string;
  flair?: string;
}

export function PostCard({ post }: { post: Post }) {
  const [vote, setVote] = useState<1 | -1 | 0>(0);
  const score = post.votes + vote;

  return (
    <article className="group flex gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          onClick={() => setVote(vote === 1 ? 0 : 1)}
          className={cn(
            "rounded-md p-1 transition hover:bg-primary/10",
            vote === 1 ? "text-primary" : "text-muted-foreground"
          )}
          aria-label="Upvote"
        >
          <ArrowUp className="size-5" />
        </button>
        <span
          className={cn(
            "text-sm font-semibold",
            vote === 1
              ? "text-primary"
              : vote === -1
              ? "text-destructive"
              : "text-foreground"
          )}
        >
          {formatCount(score)}
        </span>
        <button
          onClick={() => setVote(vote === -1 ? 0 : -1)}
          className={cn(
            "rounded-md p-1 transition hover:bg-destructive/10",
            vote === -1 ? "text-destructive" : "text-muted-foreground"
          )}
          aria-label="Downvote"
        >
          <ArrowDown className="size-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
          <Link
            href={`/c/${post.community}`}
            className="font-semibold text-foreground hover:text-primary transition"
          >
            c/{post.community}
          </Link>
          <span>·</span>
          <span>Posted by u/{post.author}</span>
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
          {post.flair && (
            <>
              <span>·</span>
              <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                {post.flair}
              </span>
            </>
          )}
        </div>

        <Link href={`/post/${post.id}`}>
          <h2 className="text-base font-semibold leading-snug group-hover:text-primary transition line-clamp-2 mb-2">
            {post.title}
          </h2>
        </Link>

        {post.image && (
          <div className="mb-3 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image}
              alt={post.title}
              className="w-full max-h-80 object-cover"
            />
          </div>
        )}

        {post.body && !post.image && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
            {post.body}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2 -ml-1">
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <MessageSquare className="size-4" />
            {formatCount(post.commentCount)} Comments
          </Link>
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition">
            <Share2 className="size-4" />
            Share
          </button>
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition">
            <Bookmark className="size-4" />
            Save
          </button>
        </div>
      </div>
    </article>
  );
}
