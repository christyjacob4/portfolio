import { notFound } from 'next/navigation'
import { CustomMDX } from '@/components/mdx'
import { extractHeadings, getBlogPosts } from '@/app/blog/utils'
import { baseUrl } from '@/lib/site'
import Link from 'next/link'
import { Toc } from '@/components/toc'
import { LabelSliders } from '@/components/label-sliders'
import { PostGridCard } from '@/components/post-card'
import { getPostCards } from '@/lib/load-posts'
import { coverVariant, formatPostDate, titleParts } from '@/lib/posts'

export async function generateStaticParams() {
  let posts = getBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export function generateMetadata({ params }) {
  let post = getBlogPosts().find((post) => post.slug === params.slug)
  if (!post) {
    return
  }

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata
  // Build-time OG image from ./og.png/route.tsx unless the post has a cover.
  const ogImage = image ? image : `/blog/${post.slug}/og.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function Blog({ params }) {
  const post = getBlogPosts().find((post) => post.slug === params.slug)

  if (!post) {
    return notFound()
  }

  const cards = getPostCards()
  const card = cards.find((c) => c.slug === post.slug)!
  const { main, deck } = titleParts(post.metadata.title)
  const headings = extractHeadings(post.content)
  const wide = post.slug === 'craft'
  const related = cards
    .filter((c) => c.slug !== post.slug)
    .sort((a, b) => Number(b.topic === card.topic) - Number(a.topic === card.topic))
    .slice(0, 2)
  const hero = coverVariant(post.metadata.image, 1280)

  return (
    <>
      <div className="read-progress" aria-hidden="true" />
      <LabelSliders />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `${baseUrl}/blog/${post.slug}/og.png`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: { '@type': 'Person', name: 'Christy Jacob', url: baseUrl },
          }),
        }}
      />
      <article>
        <header className="mx-auto max-w-[56rem] pb-8 pt-10 sm:pt-16">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link href="/blog" className="eyebrow inline-flex items-center gap-1 hover:text-foreground transition-colors">
              <span aria-hidden>&larr;</span> Writing
            </Link>
          </nav>
          <p className="eyebrow text-brand">{card.topic}</p>
          <h1 className="display mt-3 text-[clamp(2.7rem,7.5vw,5.5rem)] text-balance">{main}</h1>
          {deck && (
            <p className="display mt-3 text-[clamp(1.5rem,3.4vw,2.4rem)] italic leading-tight text-foreground/70">
              {deck}
            </p>
          )}
          <p className="mt-6 max-w-[42rem] font-serif text-[1.15rem] leading-relaxed text-foreground/80">
            {post.metadata.summary}
          </p>
          <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-foreground font-display text-sm text-background" aria-hidden>CJ</span>
            <p className="text-sm">
              <span className="font-medium">Christy Jacob</span>
              <span className="text-muted-foreground">
                {' '}&middot; <time dateTime={post.metadata.publishedAt}>{formatPostDate(post.metadata.publishedAt)}</time> &middot; {card.minutes} min read
              </span>
            </p>
          </div>
        </header>

        {hero && (
          <div className="mx-auto mb-12 max-w-[56rem] overflow-hidden rounded-2xl border border-border">
            <div className="relative aspect-[16/9] bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverVariant(post.metadata.image, 720)}
                srcSet={`${coverVariant(post.metadata.image, 720)} 720w, ${hero} 1280w`}
                sizes="(min-width:1024px) 896px, 92vw"
                width={1280}
                height={720}
                alt={`Cover illustration for ${post.metadata.title}`}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <div className={wide ? '' : 'xl:grid xl:grid-cols-[minmax(0,1fr)_42rem_minmax(0,1fr)]'}>
          <div className={wide ? '' : 'xl:col-start-2'}>
            <div className={`prose${wide ? ' max-w-none' : ' mx-auto max-w-[42rem]'}`}>
              <CustomMDX source={post.content} />
            </div>
          </div>
          {!wide && (
            <aside className="hidden xl:col-start-3 xl:row-start-1 xl:block xl:pl-24">
              <div className="sticky top-24">
                <Toc headings={headings} />
              </div>
            </aside>
          )}
        </div>
      </article>

      <section aria-labelledby="more" className="mx-auto mt-24 max-w-[56rem] border-t border-border pt-10">
        <h2 id="more" className="display mb-6 text-4xl">Keep reading</h2>
        <ul className="grid gap-5 sm:grid-cols-2">
          {related.map((p) => (
            <li key={p.slug}>
              <PostGridCard post={p} />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
