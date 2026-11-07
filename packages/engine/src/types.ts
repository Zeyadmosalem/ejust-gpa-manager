export type Component = "class" | "midterm" | "lab" | "oral" | "final";

/** Fraction of the course total that each component is worth. Must sum to 1. */
export type Weights = Partial<Record<Component, number>>;

/** Marks per component as percentages (0-100) of that component. */
export type Marks = Partial<Record<Component, number>>;

export interface GradeBand {
  letter: string;
  points: number;
  /** Lowest course percentage that earns this letter. */
  minPercent: number;
}

export interface GradeScale {
  id: string;
  grades: GradeBand[];
  /** Grades with points but no percentage band, such as WF (withdrawn failing). */
  specialGrades?: { letter: string; points: number }[];
  /** Grades that never count toward GPA hours (W, FW, I). */
  nonGpaGrades: string[];
  retakeReplacesEarlier: boolean;
}

export interface CourseResult {
  code: string;
  credits: number;
  /** A letter from the scale, or one of nonGpaGrades. */
  grade: string;
}

export interface Semester {
  id: string;
  courses: CourseResult[];
}
