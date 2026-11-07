import ejustScale from "../../../data/grade-scales/ejust.json";
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
  weightsUnverified?: boolean;
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
}

export const EJUST_SCALE = ejustScale as GradeScale;
export const CSC_PROGRAM = cscProgram as Program;

export function isSlot(c: CatalogCourse | ElectiveSlot): c is ElectiveSlot {
  return "slot" in c && c.slot === true;
}
