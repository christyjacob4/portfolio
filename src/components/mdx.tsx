import Link from 'next/link'
import Image from 'next/image'
import { MDXRemote } from 'next-mdx-remote/rsc'
import React from 'react'
import rehypePrism from 'rehype-prism-plus'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion'
import { BlogImageGrid } from './BlogImageGrid'
import { CodeBlock } from './CodeBlock'
import { countCodeLines } from '@/lib/code-lines'
import {
  Mermaid,
  AnimatedGauge,
  EQVisualizer,
  LineChart,
  ActivityRings,
  BinaryClock,
  DotMatrixClock,
  Typewriter,
  Oscilloscope,
  RadarSweep,
  Heartbeat,
  SortingVisualizer,
  MatrixRain,
  MazeGenerator,
  NoiseField,
  ParticleNetwork,
  SineWaves,
  FibonacciSpiral,
  CPUMonitor,
  HexGrid,
  MorseCode,
  PixelCanvas,
  Pendulum,
  BarcodeClock,
  Spirograph,
  BinaryRain,
  CircularProgress,
  EmbeddingSpace,
  NeuronPlayground,
  MatrixMultiplier,
  SoftmaxVisualizer,
  GradientDescentLandscape,
  SequenceOrderDemo,
  VanishingGradient,
  NetworkDiagram,
  TokenizerDemo,
  TensorVisualizer,
  DropoutDemo,
  VectorVisualizer,
  TokenFlow,
  AttentionMatrix,
  TransformerDiagram,
  QKVComputation,
  PositionalEncoding,
  EncoderDecoder,
  MaskedAttention,
  UnrolledRNN,
  LSTMGates,
  LSTMCell,
  AutoregressiveLoop,
  KVCacheVisualizer,
  MemoryWallChart,
  GPUMemoryDiagram,
  OptimizerComparison,
  LossFunctionComparison,
  LRScheduleChart,
  MemoryScalingChart,
  LSTMWalkthrough,
  Seq2SeqDiagram,
  RLHFPipeline,
  RewardModelViz,
  PPOTrainingLoop,
  DPOComparison,
  RouterVisualization,
  ExpertCapacity,
  MoEArchitecture,
  DenseVsSparse,
  NumberFormatExplorer,
  QuantizationDemo,
  MemoryCalculator,
  PerplexityVsBits,
  LowRankDecomposition,
  LoRAForwardPass,
  MemorySavings,
  RankExplorer,
  SpeculativeDecodingDemo,
  AcceptanceRate,
  SpeedupCalculator,
  TreeAttention,
  TokenizerVisualizer,
  CountingAccuracyChart,
  TurboQuantPipeline,
  RandomRotationDemo,
  LloydMaxQuantizer,
  DistortionExplorer,
  SparseVsDenseQuantization,
  BiasAccumulation,
} from './dynamic-viz'


// RLHF components

// Mixture of Experts components

// Quantization components

// LoRA components

// Speculative Decoding components
// Tokenization letter counting

// TurboQuant components

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
  return (
    <Image
      alt={props.alt}
      className="rounded-lg"
      sizes="(min-width: 768px) 640px, 100vw"
      {...props}
    />
  )
}

function Code({ children, className, ...props }) {
  return (
    <code className={className} {...props}>
      {children}
    </code>
  )
}

function Pre({ children, ...props }) {
  // MDX renders fenced code blocks as <pre><code className="language-xxx">...</code></pre>.
  // Extract the code element's props so CodeBlock can render with
  // the macOS window chrome, line numbers, and language label.
  const codeElement = React.isValidElement(children) ? children : null
  const codeProps = codeElement?.props as { className?: string; children?: React.ReactNode } | undefined

  if (codeProps) {
    return (
      <CodeBlock className={codeProps.className} lineCount={countCodeLines(codeProps.children)} {...props}>
        {codeProps.children}
      </CodeBlock>
    )
  }

  // Fallback for non-code children inside <pre> (unlikely but safe)
  return <pre {...props}>{children}</pre>
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

function createHeading(level, className?: string) {
  const Heading = ({ children }) => {
    let slug = slugify(children)
    return React.createElement(
      `h${level}`,
      { id: slug, className },
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
  SubHeading: createHeading(3, "sub-heading"),
  Image: RoundedImage,
  a: CustomLink,
  pre: Pre,
  code: Code,
  table: ScrollableTable,
  blockquote: CustomBlockquote,
  Mermaid,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  BlogImageGrid,
  AnimatedGauge,
  EQVisualizer,
  LineChart,
  ActivityRings,
  BinaryClock,
  DotMatrixClock,
  Typewriter,
  Oscilloscope,
  RadarSweep,
  Heartbeat,
  SortingVisualizer,
  MatrixRain,
  MazeGenerator,
  NoiseField,
  ParticleNetwork,
  SineWaves,
  FibonacciSpiral,
  CPUMonitor,
  HexGrid,
  MorseCode,
  PixelCanvas,
  Pendulum,
  BarcodeClock,
  Spirograph,
  BinaryRain,
  CircularProgress,
  EmbeddingSpace,
  NeuronPlayground,
  MatrixMultiplier,
  SoftmaxVisualizer,
  GradientDescentLandscape,
  SequenceOrderDemo,
  VanishingGradient,
  NetworkDiagram,
  TokenizerDemo,
  TensorVisualizer,
  DropoutDemo,
  VectorVisualizer,
  TokenFlow,
  AttentionMatrix,
  TransformerDiagram,
  QKVComputation,
  PositionalEncoding,
  EncoderDecoder,
  MaskedAttention,
  UnrolledRNN,
  LSTMGates,
  LSTMCell,
  AutoregressiveLoop,
  KVCacheVisualizer,
  MemoryWallChart,
  GPUMemoryDiagram,
  MemoryScalingChart,
  OptimizerComparison,
  LossFunctionComparison,
  LRScheduleChart,
  LSTMWalkthrough,
  Seq2SeqDiagram,
  // RLHF
  RLHFPipeline,
  RewardModelViz,
  PPOTrainingLoop,
  DPOComparison,
  // Mixture of Experts
  RouterVisualization,
  ExpertCapacity,
  MoEArchitecture,
  DenseVsSparse,
  // Quantization
  NumberFormatExplorer,
  QuantizationDemo,
  MemoryCalculator,
  PerplexityVsBits,
  // LoRA
  LowRankDecomposition,
  LoRAForwardPass,
  MemorySavings,
  RankExplorer,
  // Speculative Decoding
  SpeculativeDecodingDemo,
  AcceptanceRate,
  SpeedupCalculator,
  TreeAttention,
  // Tokenization letter counting
  TokenizerVisualizer,
  CountingAccuracyChart,
  // TurboQuant
  TurboQuantPipeline,
  RandomRotationDemo,
  LloydMaxQuantizer,
  DistortionExplorer,
  SparseVsDenseQuantization,
  BiasAccumulation,
}

export function CustomMDX(props) {
  return MDXRemote({
    ...props,
    components: { ...components, ...(props.components || {}) },
    options: {
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          remarkMath
        ],
        rehypePlugins: [
          rehypeKatex,
          rehypePrism
        ],
      },
      blockJS: false,
    }
  })
}