import { notFound } from 'next/navigation'
import { CustomMDX } from '@/components/mdx'
import { formatDate, getBlogPosts } from '@/app/blog/utils'
import { baseUrl } from '@/app/sitemap'
import Image from 'next/image'

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
  let ogImage = image
    ? image
    : `${baseUrl}/og?title=${encodeURIComponent(title)}`

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
  let post = getBlogPosts().find((post) => post.slug === params.slug)

  if (!post) {
    notFound()
  }

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
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
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              '@type': 'Person',
              name: 'My Portfolio',
            },
          }),
        }}
      />
      <div>
        <div className="mb-8">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">
            {formatDate(post.metadata.publishedAt)}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-snug mb-4" style={{ fontFamily: 'var(--font-lora), Georgia, serif', color: '#eae7e2' }}>
            {post.metadata.title}
          </h1>
          <p className="max-w-2xl leading-relaxed" style={{ fontFamily: 'var(--font-lora), Georgia, serif', color: '#b5b1ab', fontSize: '1.02rem', lineHeight: '1.7' }}>
            {post.metadata.summary}
          </p>
        </div>
        
        {post.metadata.image && (
          <div className="relative aspect-video overflow-hidden rounded-xl shadow-2xl mb-8">
            <Image
              src={post.metadata.image}
              alt={`${post.metadata.title} hero image`}
              fill
              priority
              quality={75}
              className="object-cover"
            />
          </div>
        )}
      </div>
      
      <article className="prose mt-8">
        <CustomMDX source={post.content} />
      </article>
    </section>
  )
}