import {
  CSC_PROGRAM,
  EJUST_CSIT_SCALE,
  courseTotal,
  cumulative,
  isSlot,
  letterFor,
  scaleFor,
  semesterGpa,
  type CatalogCourse,
  type Component,
  type CourseResult,
  type GpaSummary,
  type GradeScale,
  type Weights,
} from "@ejust-gpa/engine";
import type { Enrollment, SemesterRecord } from "./store";

export const PROGRAM = CSC_PROGRAM;
/** Grade points are the same on every E-JUST scale, so GPA uses the CSIT one. */
export const GPA_SCALE = EJUST_CSIT_SCALE;
export const LETTERS = GPA_SCALE.grades.map((g) => g.letter);
export const OTHER_GRADES = ["WF", "W", "FW", "I"];
const FAILING = new Set(["F", "WF"]);
const NOT_COUNTED = new Set(GPA_SCALE.nonGpaGrades);

export const COMPONENT_LABELS: Record<Component, string> = {
  class: "Class work",
  midterm: "Midterm",
  lab: "Lab",
  oral: "Oral",
  final: "Final",
};

export function components(w: Weights): Component[] {
  return (Object.keys(COMPONENT_LABELS) as Component[]).filter((c) => (w[c] ?? 0) > 0);
}

export function scaleOf(e: { gradeScale?: string }): GradeScale {
  return scaleFor(e, PROGRAM);
}

export function marksComplete(e: Enrollment): boolean {
  return components(e.weights).every((c) => typeof e.marks[c] === "number");
}

export function hasAnyMarks(e: Enrollment): boolean {
  return components(e.weights).some((c) => typeof e.marks[c] === "number");
}

export function totalPercent(e: Enrollment): number {
  return courseTotal(e.marks, e.weights);
}

/** The course's actual grade, or null while it is still in progress. */
export function finalGrade(e: Enrollment): string | null {
  if (e.grade) return e.grade;
  if (marksComplete(e)) return letterFor(totalPercent(e), scaleOf(e)).letter;
  return null;
}

function results(s: SemesterRecord, projected: boolean): CourseResult[] {
  return s.courses.flatMap((e) => {
    const grade = finalGrade(e) ?? (projected ? e.target ?? null : null);
    return grade ? [{ code: e.code, credits: e.credits, grade }] : [];
  });
}

export function semesterSummary(s: SemesterRecord, projected = false): GpaSummary {
  return semesterGpa(results(s, projected), GPA_SCALE);
}

export function cumulativeSummary(semesters: SemesterRecord[], projected = false): GpaSummary {
  return cumulative(
    semesters.map((s) => ({ id: s.id, courses: results(s, projected) })),
    GPA_SCALE,
  );
}

export type CourseStatus = "passed" | "failed" | "in-progress" | "withdrawn";

/** Latest status per course code, in semester order. */
export function courseStatuses(semesters: SemesterRecord[]): Map<string, { status: CourseStatus; grade?: string; credits: number }> {
  const out = new Map<string, { status: CourseStatus; grade?: string; credits: number }>();
  for (const s of semesters) {
    for (const e of s.courses) {
      const g = finalGrade(e);
      const prev = out.get(e.code);
      let status: CourseStatus;
      if (!g) status = "in-progress";
      else if (NOT_COUNTED.has(g)) status = "withdrawn";
      else status = FAILING.has(g) ? "failed" : "passed";
      // A withdrawal does not undo an earlier pass.
      if (status === "withdrawn" && prev && prev.status === "passed") continue;
      out.set(e.code, { status, grade: g ?? undefined, credits: e.credits });
    }
  }
  return out;
}

export function passedCredits(semesters: SemesterRecord[]): number {
  let n = 0;
  for (const v of courseStatuses(semesters).values()) if (v.status === "passed") n += v.credits;
  return n;
}

export interface CatalogEntry extends Omit<CatalogCourse, "level" | "category"> {
  level?: number;
  group: string;
}

export const CATALOG: CatalogEntry[] = [
  ...PROGRAM.courses.flatMap((c) => (isSlot(c) ? [] : [{ ...c, group: `Level ${c.level}` }])),
  ...Object.entries(PROGRAM.electives).flatMap(([table, t]) =>
    t.courses.map((c) => ({ ...c, group: `${table}: ${t.title}` })),
  ),
];

export function fmt(x: number | null | undefined, digits = 2): string {
  return x === null || x === undefined || Number.isNaN(x) ? "–" : x.toFixed(digits);
}
