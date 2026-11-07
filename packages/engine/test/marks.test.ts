import { describe, expect, it } from "vitest";
import { courseMarks, courseTotal, EJUST_SCALE, letterFor, requiredMark, requiredMarksByLetter } from "../src";

const STD = { class: 0.15, midterm: 0.3, lab: 0.15, final: 0.4 };

describe("courseTotal", () => {
  it("weights each component", () => {
    // 0.15*80 + 0.3*70 + 0.15*90 + 0.4*60 = 12 + 21 + 13.5 + 24 = 70.5
    expect(courseTotal({ class: 80, midterm: 70, lab: 90, final: 60 }, STD)).toBeCloseTo(70.5);
  });
  it("treats missing marks as 0", () => {
    expect(courseTotal({ class: 100, midterm: 100 }, STD)).toBeCloseTo(45);
  });
  it("rejects weights that do not sum to 1", () => {
    expect(() => courseTotal({}, { class: 0.5, final: 0.4 })).toThrow();
  });
  it("converts to absolute marks at 100 marks per credit", () => {
    expect(courseMarks({ class: 80, midterm: 70, lab: 90, final: 60 }, STD, 3)).toBeCloseTo(211.5);
  });
});

describe("letterFor", () => {
  it("picks the highest band reached", () => {
    expect(letterFor(100, EJUST_SCALE).letter).toBe("A+");
    expect(letterFor(0, EJUST_SCALE).letter).toBe("F");
    const b = EJUST_SCALE.grades.find((g) => g.letter === "B")!;
    expect(letterFor(b.minPercent, EJUST_SCALE).letter).toBe("B");
    expect(letterFor(b.minPercent - 0.01, EJUST_SCALE).letter).toBe("C+");
  });
});

describe("requiredMark", () => {
  const sofar = { class: 80, midterm: 70, lab: 90 }; // 46.5 of 60 possible
  it("finds the final mark needed", () => {
    // (70 - 46.5) / 0.4 = 58.75
    expect(requiredMark(sofar, STD, 70)).toBeCloseTo(58.75);
  });
  it("returns 0 when the target is already reached", () => {
    expect(requiredMark(sofar, STD, 40)).toBe(0);
  });
  it("returns null when the target is out of reach", () => {
    expect(requiredMark(sofar, STD, 90)).toBeNull();
  });
  it("ignores any final mark already entered", () => {
    expect(requiredMark({ ...sofar, final: 100 }, STD, 70)).toBeCloseTo(58.75);
  });
  it("lists every letter", () => {
    const rows = requiredMarksByLetter(sofar, STD, EJUST_SCALE);
    expect(rows.map((r) => r.letter)).toEqual(["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"]);
    expect(rows.at(-1)!.required).toBe(0);
  });
});
