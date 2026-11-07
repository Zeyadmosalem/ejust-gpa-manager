import { describe, expect, it } from "vitest";
import { cgpaTimeline, cumulative, EJUST_CSIT_SCALE, requiredFutureGpa, semesterGpa } from "../src";
import type { Semester } from "../src";

// Made-up student, hand-checked numbers.
const fall: Semester = {
  id: "fall",
  courses: [
    { code: "MTH111", credits: 3, grade: "A" }, // 11.1
    { code: "PHY113", credits: 3, grade: "F" }, // 3.0 (F counts 1.0)
    { code: "CSC111", credits: 3, grade: "B+" }, // 9.9
    { code: "LRA401", credits: 1, grade: "W" }, // not counted
  ],
};
const spring: Semester = {
  id: "spring",
  courses: [
    { code: "PHY113", credits: 3, grade: "C" }, // retake: 6.9 replaces 3.0
    { code: "MTH121", credits: 3, grade: "B" }, // 9.0
  ],
};

describe("semesterGpa", () => {
  it("counts F as 1.0 and skips withdrawals", () => {
    const s = semesterGpa(fall.courses, EJUST_CSIT_SCALE);
    expect(s.gpaHours).toBe(9);
    expect(s.qualityPoints).toBeCloseTo(24);
    expect(s.gpa).toBeCloseTo(24 / 9);
  });
  it("is null with no graded hours", () => {
    expect(semesterGpa([{ code: "X", credits: 2, grade: "W" }], EJUST_CSIT_SCALE).gpa).toBeNull();
  });
});

describe("cumulative", () => {
  it("lets a retake replace the earlier grade", () => {
    const c = cumulative([fall, spring], EJUST_CSIT_SCALE);
    // 11.1 + 9.9 + 6.9 + 9.0 = 36.9 over 12 hours
    expect(c.gpaHours).toBe(12);
    expect(c.gpa).toBeCloseTo(36.9 / 12);
  });
  it("counts every attempt when retakes do not replace", () => {
    const c = cumulative([fall, spring], { ...EJUST_CSIT_SCALE, retakeReplacesEarlier: false });
    expect(c.gpaHours).toBe(15);
    expect(c.gpa).toBeCloseTo(39.9 / 15);
  });
  it("keeps an earlier grade when the retake is withdrawn", () => {
    const w: Semester = { id: "w", courses: [{ code: "MTH111", credits: 3, grade: "W" }] };
    expect(cumulative([fall, w], EJUST_CSIT_SCALE).gpa).toBeCloseTo(24 / 9);
  });
  it("counts WF as 1.0 and lets it replace an earlier grade", () => {
    const wf: Semester = { id: "wf", courses: [{ code: "MTH111", credits: 3, grade: "WF" }] };
    // MTH111 A (11.1) replaced by WF (3.0): 3.0 + 3.0 + 9.9 = 15.9 over 9
    expect(cumulative([fall, wf], EJUST_CSIT_SCALE).gpa).toBeCloseTo(15.9 / 9);
  });
  it("ignores FW", () => {
    expect(semesterGpa([{ code: "X", credits: 3, grade: "FW" }], EJUST_CSIT_SCALE).gpaHours).toBe(0);
  });
  it("builds a timeline", () => {
    const t = cgpaTimeline([fall, spring], EJUST_CSIT_SCALE);
    expect(t.map((x) => x.gpa)).toEqual([expect.closeTo(24 / 9), expect.closeTo(36.9 / 12)]);
  });
});

describe("requiredFutureGpa", () => {
  const now = { gpa: 2.5, gpaHours: 60, qualityPoints: 150 };
  it("finds the average needed", () => {
    // (3.0 * 120 - 150) / 60 = 3.5
    expect(requiredFutureGpa(now, 60, 3.0, EJUST_CSIT_SCALE)).toBeCloseTo(3.5);
  });
  it("returns null when above the top grade", () => {
    expect(requiredFutureGpa(now, 10, 3.9, EJUST_CSIT_SCALE)).toBeNull();
  });
});
