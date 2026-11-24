/** GitHub star count at build time. Returns null if the API is unavailable. */
export async function fetchStars(githubUrl?: string): Promise<number | null> {
  if (!githubUrl) return null;
  try {
    const repo = githubUrl.replace("https://github.com/", "");
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stargazers_count ?? null;
  } catch {
    return null;
  }
}

export function formatStars(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}
