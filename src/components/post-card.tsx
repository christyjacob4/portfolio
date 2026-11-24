import Link from "next/link";
import { PostCard, coverVariant, formatPostDate, titleParts } from "@/lib/posts";

export function Cover({
  post,
  sizes,
  priority,
}: {
  post: PostCard;
  sizes: string;
  priority?: boolean;
  /** kept for call-site compatibility; both widths are offered via srcSet */
  w?: 720 | 1280;
}) {
  const s720 = coverVariant(post.image, 720);
  const s1280 = coverVariant(post.image, 1280);
  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
      {s720 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s720}
          srcSet={`${s720} 720w, ${s1280} 1280w`}
          sizes={sizes}
          width={1280}
          height={720}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-brand-soft">
          <span className="display text-5xl text-brand/70">{titleParts(post.title).main.slice(0, 1)}</span>
        </div>
      )}
    </div>
  );
}

export function PostMeta({ post }: { post: PostCard }) {
  return (
    <p className="font-mono text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt, { short: true })}</time>
      <span aria-hidden> &middot; </span>
      {post.minutes} min read
    </p>
  );
}

/** Grid card used on the blog index. */
export function PostGridCard({ post, priority }: { post: PostCard; priority?: boolean }) {
  const { main, deck } = titleParts(post.title);
  return (
    <Link
      prefetch={false}
          href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_18px_40px_-24px_hsl(var(--foreground)/0.4)]"
    >
      <Cover post={post} sizes="(min-width:1024px) 360px, (min-width:640px) 45vw, 92vw" priority={priority} />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="eyebrow text-brand">{post.topic}</p>
        <h3 className="display text-[1.7rem] leading-[1.08]">{main}</h3>
        {deck && <p className="text-[0.95rem] font-medium leading-snug text-foreground/80">{deck}</p>}
        <div className="mt-auto pt-3">
          <PostMeta post={post} />
        </div>
      </div>
    </Link>
  );
}
