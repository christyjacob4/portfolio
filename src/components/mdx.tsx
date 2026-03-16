import Link from 'next/link'
import Image from 'next/image'
import { MDXRemote } from 'next-mdx-remote/rsc'
import React from 'react'
import rehypePrism from 'rehype-prism-plus'
import remarkGfm from 'remark-gfm'
import dynamic from 'next/dynamic'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion'
import { BlogImageGrid } from './BlogImageGrid'

// Dynamically import the Mermaid component with SSR disabled
const Mermaid = dynamic(() => import('./Mermaid'), { ssr: false })

// RNN blog post interactive visualizations
const NetworkComparison = dynamic(() => import('./blog/rnn/NetworkComparison'), { ssr: false })
const RNNUnrolled = dynamic(() => import('./blog/rnn/RNNUnrolled'), { ssr: false })
const GradientExplorer = dynamic(() => import('./blog/rnn/GradientExplorer'), { ssr: false })
const LSTMViz = dynamic(() => import('./blog/rnn/LSTMViz'), { ssr: false })
const GRUViz = dynamic(() => import('./blog/rnn/GRUViz'), { ssr: false })
const BiRNNViz = dynamic(() => import('./blog/rnn/BiRNNViz'), { ssr: false })
const Seq2SeqViz = dynamic(() => import('./blog/rnn/Seq2SeqViz'), { ssr: false })
const AttentionViz = dynamic(() => import('./blog/rnn/AttentionViz'), { ssr: false })

function CustomLink(props) {
  let href = props.href

  if (href.startsWith('/')) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    )
  }

  if (href.startsWith('#')) {
    return <a {...props} />
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />
}

function RoundedImage(props) {
  return <Image alt={props.alt} className="rounded-lg" {...props} />
}

function Code({ children, className, ...props }) {
  return (
    <code className={className} {...props}>
      {children}
    </code>
  )
}

function ScrollableTable({ children, ...props }) {
  return (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full" {...props}>
        {children}
      </table>
    </div>
  )
}

function CustomBlockquote({ children, ...props }) {
  return (
    <blockquote 
      className="border-l-4 border-slate-600 dark:border-slate-500 bg-slate-100 dark:bg-slate-800/70 px-4 py-1 italic text-slate-800 dark:text-slate-200"
      {...props}
    >
      {children}
    </blockquote>
  )
}

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except for -
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

function createHeading(level) {
  const Heading = ({ children }) => {
    let slug = slugify(children)
    return React.createElement(
      `h${level}`,
      { id: slug },
      [
        React.createElement('a', {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: 'anchor',
        }),
      ],
      children
    )
  }

  Heading.displayName = `Heading${level}`

  return Heading
}

let components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  table: ScrollableTable,
  blockquote: CustomBlockquote,
  Mermaid,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  BlogImageGrid,
  NetworkComparison,
  RNNUnrolled,
  GradientExplorer,
  LSTMViz,
  GRUViz,
  BiRNNViz,
  Seq2SeqViz,
  AttentionViz
}

export function CustomMDX(props) {
  return MDXRemote({
    ...props,
    components: { ...components, ...(props.components || {}) },
    options: {
      mdxOptions: {
        remarkPlugins: [
          remarkGfm
        ],
        rehypePlugins: [
          rehypePrism
        ],
      },
      blockJS: false,
    }
  })
}