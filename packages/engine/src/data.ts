import csitScale from "../../../data/grade-scales/ejust-csit.json";
import liberalArtsScale from "../../../data/grade-scales/ejust-liberal-arts.json";
import cscProgram from "../../../data/programs/csc.json";
import type { GradeScale, Weights } from "./types";

export interface CatalogCourse {
  code: string;
  title: string;
  credits: number;
  level: number;
  category: string;
  prerequisites: string[];
  weights: Weights;
  examHours: number | null;
  /** Overrides the program's grade scale (e.g. LRA courses). */
  gradeScale?: string;
}

export type ElectiveCourse = Omit<CatalogCourse, "level" | "category">;

export interface ElectiveTable {
  title: string;
  requiredCredits: number;
  courses: ElectiveCourse[];
}

export interface ElectiveSlot {
  slot: true;
  title: string;
  credits: number;
  level: number;
  category: string;
  electiveTable: string;
}

export interface Program {
  id: string;
  name: string;
  totalCredits: number;
  marksPerCredit: number;
  gradeScale: string;
  levelCredits: Record<string, number>;
  courses: (CatalogCourse | ElectiveSlot)[];
  electives: Record<string, ElectiveTable>;
}

export const EJUST_CSIT_SCALE = csitScale as GradeScale;
export const EJUST_LIBERAL_ARTS_SCALE = liberalArtsScale as GradeScale;
export const GRADE_SCALES: Record<string, GradeScale> = {
  [EJUST_CSIT_SCALE.id]: EJUST_CSIT_SCALE,
  [EJUST_LIBERAL_ARTS_SCALE.id]: EJUST_LIBERAL_ARTS_SCALE,
};
export const CSC_PROGRAM = cscProgram as Program;

export function isSlot(c: CatalogCourse | ElectiveSlot): c is ElectiveSlot {
  return "slot" in c && c.slot === true;
}

/** The grade scale that sets letter cutoffs for a course. */
export function scaleFor(course: { gradeScale?: string }, program: Program): GradeScale {
  const id = course.gradeScale ?? program.gradeScale;
  const scale = GRADE_SCALES[id];
  if (!scale) throw new Error(`Unknown grade scale "${id}"`);
  return scale;
}
