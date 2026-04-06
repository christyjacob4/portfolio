import Link from 'next/link'
import Image from 'next/image'
import { MDXRemote } from 'next-mdx-remote/rsc'
import React from 'react'
import rehypePrism from 'rehype-prism-plus'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import dynamic from 'next/dynamic'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion'
import { BlogImageGrid } from './BlogImageGrid'
import { CodeBlock } from './CodeBlock'

// Dynamically import the Mermaid component with SSR disabled
const Mermaid = dynamic(() => import('./Mermaid'), { ssr: false })
const AnimatedGauge = dynamic(() => import('./craft/AnimatedGauge'), { ssr: false })
const EQVisualizer = dynamic(() => import('./craft/EQVisualizer'), { ssr: false })
const LineChart = dynamic(() => import('./craft/LineChart'), { ssr: false })
const ActivityRings = dynamic(() => import('./craft/ActivityRings'), { ssr: false })
const BinaryClock = dynamic(() => import('./craft/BinaryClock'), { ssr: false })
const DotMatrixClock = dynamic(() => import('./craft/DotMatrixClock'), { ssr: false })
const Typewriter = dynamic(() => import('./craft/Typewriter'), { ssr: false })
const Oscilloscope = dynamic(() => import('./craft/Oscilloscope'), { ssr: false })
const RadarSweep = dynamic(() => import('./craft/RadarSweep'), { ssr: false })
const Heartbeat = dynamic(() => import('./craft/Heartbeat'), { ssr: false })
const SortingVisualizer = dynamic(() => import('./craft/SortingVisualizer'), { ssr: false })
const MatrixRain = dynamic(() => import('./craft/MatrixRain'), { ssr: false })
const MazeGenerator = dynamic(() => import('./craft/MazeGenerator'), { ssr: false })
const NoiseField = dynamic(() => import('./craft/NoiseField'), { ssr: false })
const ParticleNetwork = dynamic(() => import('./craft/ParticleNetwork'), { ssr: false })
const SineWaves = dynamic(() => import('./craft/SineWaves'), { ssr: false })
const FibonacciSpiral = dynamic(() => import('./craft/FibonacciSpiral'), { ssr: false })
const CPUMonitor = dynamic(() => import('./craft/CPUMonitor'), { ssr: false })
const HexGrid = dynamic(() => import('./craft/HexGrid'), { ssr: false })
const MorseCode = dynamic(() => import('./craft/MorseCode'), { ssr: false })
const PixelCanvas = dynamic(() => import('./craft/PixelCanvas'), { ssr: false })
const Pendulum = dynamic(() => import('./craft/Pendulum'), { ssr: false })
const BarcodeClock = dynamic(() => import('./craft/BarcodeClock'), { ssr: false })
const Spirograph = dynamic(() => import('./craft/Spirograph'), { ssr: false })
const BinaryRain = dynamic(() => import('./craft/BinaryRain'), { ssr: false })
const CircularProgress = dynamic(() => import('./craft/CircularProgress'), { ssr: false })
const EmbeddingSpace = dynamic(() => import('./blog/building-blocks/EmbeddingSpace'), { ssr: false })
const NeuronPlayground = dynamic(() => import('./blog/building-blocks/NeuronPlayground'), { ssr: false })
const MatrixMultiplier = dynamic(() => import('./blog/building-blocks/MatrixMultiplier'), { ssr: false })
const SoftmaxVisualizer = dynamic(() => import('./blog/building-blocks/SoftmaxVisualizer'), { ssr: false })
const GradientDescentLandscape = dynamic(() => import('./blog/building-blocks/GradientDescentLandscape'), { ssr: false })
const SequenceOrderDemo = dynamic(() => import('./blog/building-blocks/SequenceOrderDemo'), { ssr: false })
const VanishingGradient = dynamic(() => import('./blog/building-blocks/VanishingGradient'), { ssr: false })
const NetworkDiagram = dynamic(() => import('./blog/building-blocks/NetworkDiagram'), { ssr: false })
const TokenizerDemo = dynamic(() => import('./blog/building-blocks/TokenizerDemo'), { ssr: false })
const TensorVisualizer = dynamic(() => import('./blog/building-blocks/TensorVisualizer'), { ssr: false })
const DropoutDemo = dynamic(() => import('./blog/building-blocks/DropoutDemo'), { ssr: false })
const VectorVisualizer = dynamic(() => import('./blog/building-blocks/VectorVisualizer'), { ssr: false })
const TokenFlow = dynamic(() => import('./blog/transformers/TokenFlow'), { ssr: false })
const AttentionMatrix = dynamic(() => import('./blog/transformers/AttentionMatrix'), { ssr: false })
const TransformerDiagram = dynamic(() => import('./blog/transformers/TransformerDiagram'), { ssr: false })
const QKVComputation = dynamic(() => import('./blog/transformers/QKVComputation'), { ssr: false })
const PositionalEncoding = dynamic(() => import('./blog/transformers/PositionalEncoding'), { ssr: false })
const EncoderDecoder = dynamic(() => import('./blog/transformers/EncoderDecoder'), { ssr: false })
const MaskedAttention = dynamic(() => import('./blog/transformers/MaskedAttention'), { ssr: false })
const UnrolledRNN = dynamic(() => import('./blog/language-modeling/UnrolledRNN'), { ssr: false })
const LSTMGates = dynamic(() => import('./blog/language-modeling/LSTMGates'), { ssr: false })
const LSTMCell = dynamic(() => import('./blog/language-modeling/LSTMCell'), { ssr: false })
const AutoregressiveLoop = dynamic(() => import('./blog/kv-caching/AutoregressiveLoop'), { ssr: false })
const KVCacheVisualizer = dynamic(() => import('./blog/kv-caching/KVCacheVisualizer'), { ssr: false })
const MemoryWallChart = dynamic(() => import('./blog/kv-caching/MemoryWallChart'), { ssr: false })
const GPUMemoryDiagram = dynamic(() => import('./blog/flash-attention/GPUMemoryDiagram'), { ssr: false })
const OptimizerComparison = dynamic(() => import('./blog/optimizers/OptimizerComparison'), { ssr: false })
const LossFunctionComparison = dynamic(() => import('./blog/optimizers/LossFunctionComparison'), { ssr: false })
const LRScheduleChart = dynamic(() => import('./blog/optimizers/LRScheduleChart'), { ssr: false })
const MemoryScalingChart = dynamic(() => import('./blog/flash-attention/MemoryScalingChart'), { ssr: false })
const LSTMWalkthrough = dynamic(() => import('./blog/language-modeling/LSTMWalkthrough'), { ssr: false })
const Seq2SeqDiagram = dynamic(() => import('./blog/language-modeling/Seq2SeqDiagram'), { ssr: false })

// RLHF components
const RLHFPipeline = dynamic(() => import('./blog/rlhf/RLHFPipeline'), { ssr: false })
const RewardModelViz = dynamic(() => import('./blog/rlhf/RewardModelViz'), { ssr: false })
const PPOTrainingLoop = dynamic(() => import('./blog/rlhf/PPOTrainingLoop'), { ssr: false })
const DPOComparison = dynamic(() => import('./blog/rlhf/DPOComparison'), { ssr: false })

// Mixture of Experts components
const RouterVisualization = dynamic(() => import('./blog/moe/RouterVisualization'), { ssr: false })
const ExpertCapacity = dynamic(() => import('./blog/moe/ExpertCapacity'), { ssr: false })
const MoEArchitecture = dynamic(() => import('./blog/moe/MoEArchitecture'), { ssr: false })
const DenseVsSparse = dynamic(() => import('./blog/moe/DenseVsSparse'), { ssr: false })

// Quantization components
const NumberFormatExplorer = dynamic(() => import('./blog/quantization/NumberFormatExplorer'), { ssr: false })
const QuantizationDemo = dynamic(() => import('./blog/quantization/QuantizationDemo'), { ssr: false })
const MemoryCalculator = dynamic(() => import('./blog/quantization/MemoryCalculator'), { ssr: false })
const PerplexityVsBits = dynamic(() => import('./blog/quantization/PerplexityVsBits'), { ssr: false })

// LoRA components
const LowRankDecomposition = dynamic(() => import('./blog/lora/LowRankDecomposition'), { ssr: false })
const LoRAForwardPass = dynamic(() => import('./blog/lora/LoRAForwardPass'), { ssr: false })
const MemorySavings = dynamic(() => import('./blog/lora/MemorySavings'), { ssr: false })
const RankExplorer = dynamic(() => import('./blog/lora/RankExplorer'), { ssr: false })

// Speculative Decoding components
const SpeculativeDecodingDemo = dynamic(() => import('./blog/speculative-decoding/SpeculativeDecodingDemo'), { ssr: false })
const AcceptanceRate = dynamic(() => import('./blog/speculative-decoding/AcceptanceRate'), { ssr: false })
const SpeedupCalculator = dynamic(() => import('./blog/speculative-decoding/SpeedupCalculator'), { ssr: false })
const TreeAttention = dynamic(() => import('./blog/speculative-decoding/TreeAttention'), { ssr: false })
// Tokenization letter counting
const TokenizerVisualizer = dynamic(() => import('./blog/tokenization/TokenizerVisualizer'), { ssr: false })
const CountingAccuracyChart = dynamic(() => import('./blog/tokenization/CountingAccuracyChart'), { ssr: false })

// TurboQuant components
const TurboQuantPipeline = dynamic(() => import('./blog/turboquant/TurboQuantPipeline'), { ssr: false })
const RandomRotationDemo = dynamic(() => import('./blog/turboquant/RandomRotationDemo'), { ssr: false })
const LloydMaxQuantizer = dynamic(() => import('./blog/turboquant/LloydMaxQuantizer'), { ssr: false })
const DistortionExplorer = dynamic(() => import('./blog/turboquant/DistortionExplorer'), { ssr: false })
const SparseVsDenseQuantization = dynamic(() => import('./blog/turboquant/SparseVsDenseQuantization'), { ssr: false })
const BiasAccumulation = dynamic(() => import('./blog/turboquant/BiasAccumulation'), { ssr: false })

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

function Pre({ children, ...props }) {
  // MDX renders fenced code blocks as <pre><code className="language-xxx">...</code></pre>.
  // Extract the code element's props so CodeBlock can render with
  // the macOS window chrome, line numbers, and language label.
  const codeElement = React.isValidElement(children) ? children : null
  const codeProps = codeElement?.props as { className?: string; children?: React.ReactNode } | undefined

  if (codeProps) {
    return (
      <CodeBlock className={codeProps.className} {...props}>
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