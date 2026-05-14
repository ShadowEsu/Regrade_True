/** Fisher–Yates shuffle for session-variety picks */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickWeightedUnique<T extends { id: string; weight?: number }>(items: T[], n: number): T[] {
  const pool = shuffle(items);
  pool.sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const x of pool) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
    if (out.length >= n) break;
  }
  return out;
}
