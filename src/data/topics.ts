export type Topic = "Foundations" | "Inference" | "Training" | "Systems" | "Notes";

/** Editorial grouping for the blog index. Unlisted posts fall back to "Notes". */
export const topicBySlug: Record<string, Topic> = {
  "deep-learning-from-first-principles": "Foundations",
  "language-modeling": "Foundations",
  "attention-is-all-you-need": "Foundations",
  optimizers: "Training",
  regularization: "Training",
  lora: "Training",
  rlhf: "Training",
  "mixture-of-experts": "Training",
  "kv-caching": "Inference",
  "flash-attention": "Inference",
  "speculative-decoding": "Inference",
  "model-quantization": "Inference",
  turboquant: "Inference",
  "postgres-extensions": "Systems",
};

export const topics: Topic[] = ["Foundations", "Training", "Inference", "Systems", "Notes"];

export function topicOf(slug: string): Topic {
  return topicBySlug[slug] ?? "Notes";
}
