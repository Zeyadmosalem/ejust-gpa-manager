import type { CourseResult, GradeScale, Semester } from "./types";

export interface GpaSummary {
  gpa: number | null;
  /** Credit hours that count toward GPA. */
  gpaHours: number;
  qualityPoints: number;
}

function pointsFor(grade: string, scale: GradeScale): number | null {
  if (scale.nonGpaGrades.includes(grade)) return null;
  const band = scale.grades.find((g) => g.letter === grade);
  if (!band) throw new Error(`Unknown grade "${grade}"`);
  return band.points;
}

export function summarize(courses: CourseResult[], scale: GradeScale): GpaSummary {
  let gpaHours = 0;
  let qualityPoints = 0;
  for (const c of courses) {
    const p = pointsFor(c.grade, scale);
    if (p === null) continue;
    gpaHours += c.credits;
    qualityPoints += p * c.credits;
  }
  return { gpa: gpaHours > 0 ? qualityPoints / gpaHours : null, gpaHours, qualityPoints };
}

export const semesterGpa = summarize;

/**
 * Cumulative GPA over semesters in chronological order. With
 * `retakeReplacesEarlier`, only the latest graded attempt of each course code
 * counts. A later withdrawal does not erase an earlier grade.
 */
export function cumulative(semesters: Semester[], scale: GradeScale): GpaSummary {
  if (!scale.retakeReplacesEarlier) {
    return summarize(semesters.flatMap((s) => s.courses), scale);
  }
  const latest = new Map<string, CourseResult>();
  for (const s of semesters) {
    for (const c of s.courses) {
      if (!scale.nonGpaGrades.includes(c.grade)) latest.set(c.code, c);
    }
  }
  return summarize([...latest.values()], scale);
}

/** CGPA after each semester, in order. */
export function cgpaTimeline(semesters: Semester[], scale: GradeScale): GpaSummary[] {
  return semesters.map((_, i) => cumulative(semesters.slice(0, i + 1), scale));
}

/**
 * Average GPA needed over `remainingHours` to finish at `targetCgpa`.
 * Returns null if it would take more than the top grade's points.
 * Assumes no retakes in the remaining hours.
 */
export function requiredFutureGpa(
  current: GpaSummary,
  remainingHours: number,
  targetCgpa: number,
  scale: GradeScale,
): number | null {
  if (remainingHours <= 0) throw new Error("remainingHours must be positive");
  const needed = (targetCgpa * (current.gpaHours + remainingHours) - current.qualityPoints) / remainingHours;
  const max = Math.max(...scale.grades.map((g) => g.points));
  const min = Math.min(...scale.grades.map((g) => g.points));
  if (needed > max + 1e-9) return null;
  return Math.max(min, needed);
}
