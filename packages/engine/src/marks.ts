import type { Component, GradeBand, GradeScale, Marks, Weights } from "./types";

const EPS = 1e-9;

function entries(weights: Weights): [Component, number][] {
  return Object.entries(weights).filter(([, w]) => (w ?? 0) > 0) as [Component, number][];
}

export function assertWeights(weights: Weights): void {
  const sum = entries(weights).reduce((s, [, w]) => s + w, 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`Weights must sum to 1, got ${sum}`);
  }
}

/**
 * Course total as a percentage (0-100). Components without a mark count as 0,
 * so this is also "marks earned so far".
 */
export function courseTotal(marks: Marks, weights: Weights): number {
  assertWeights(weights);
  return entries(weights).reduce((s, [c, w]) => s + w * clampPct(marks[c] ?? 0), 0);
}

/** Total in absolute marks, where one credit hour is worth `marksPerCredit` marks. */
export function courseMarks(marks: Marks, weights: Weights, credits: number, marksPerCredit = 100): number {
  return (courseTotal(marks, weights) / 100) * credits * marksPerCredit;
}

function sortedBands(scale: GradeScale): GradeBand[] {
  return [...scale.grades].sort((a, b) => b.minPercent - a.minPercent);
}

export function letterFor(percent: number, scale: GradeScale): GradeBand {
  const band = sortedBands(scale).find((g) => percent + EPS >= g.minPercent);
  if (!band) throw new Error(`No grade band covers ${percent}%`);
  return band;
}

/**
 * Minimum mark (0-100) needed on `component` to reach `targetPercent`, given
 * the other components' marks. Returns 0 if already reached, null if impossible.
 */
export function requiredMark(
  marks: Marks,
  weights: Weights,
  targetPercent: number,
  component: Component = "final",
): number | null {
  assertWeights(weights);
  const w = weights[component] ?? 0;
  if (w <= 0) throw new Error(`Component "${component}" has no weight in this course`);
  const others = { ...marks, [component]: 0 };
  const needed = (targetPercent - courseTotal(others, weights)) / w;
  if (needed <= EPS) return 0;
  if (needed > 100 + EPS) return null;
  return Math.min(100, needed);
}

/** Required mark on `component` for every letter in the scale. */
export function requiredMarksByLetter(
  marks: Marks,
  weights: Weights,
  scale: GradeScale,
  component: Component = "final",
): { letter: string; required: number | null }[] {
  return sortedBands(scale).map((g) => ({
    letter: g.letter,
    required: requiredMark(marks, weights, g.minPercent, component),
  }));
}

function clampPct(x: number): number {
  return Math.max(0, Math.min(100, x));
}
