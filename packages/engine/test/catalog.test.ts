import { describe, expect, it } from "vitest";
import { assertWeights, CSC_PROGRAM, EJUST_SCALE, isSlot } from "../src";

describe("E-JUST grade scale", () => {
  it("has unique letters and descending cutoffs", () => {
    const letters = EJUST_SCALE.grades.map((g) => g.letter);
    expect(new Set(letters).size).toBe(letters.length);
    const cut = EJUST_SCALE.grades.map((g) => g.minPercent);
    expect([...cut].sort((a, b) => b - a)).toEqual(cut);
    expect(cut.at(-1)).toBe(0);
  });
});

describe("CSC study plan", () => {
  const p = CSC_PROGRAM;
  const courses = p.courses.filter((c) => !isSlot(c));
  const codes = new Set(courses.map((c) => !isSlot(c) && c.code));

  it("adds up to 134 credits", () => {
    expect(p.courses.reduce((s, c) => s + c.credits, 0)).toBe(p.totalCredits);
    expect(p.totalCredits).toBe(134);
  });
  it("matches the credits for each level", () => {
    for (const [lvl, credits] of Object.entries(p.levelCredits)) {
      const sum = p.courses.filter((c) => c.level === Number(lvl)).reduce((s, c) => s + c.credits, 0);
      expect(sum, `level ${lvl}`).toBe(credits);
    }
  });
  it("has unique course codes", () => {
    expect(codes.size).toBe(courses.length);
  });
  it("has weights that sum to 1", () => {
    for (const c of courses) if (!isSlot(c)) expect(() => assertWeights(c.weights), c.code).not.toThrow();
  });
  it("only lists prerequisites that are earlier in the plan", () => {
    for (const c of courses) {
      if (isSlot(c)) continue;
      for (const pre of c.prerequisites) {
        const pc = courses.find((x) => !isSlot(x) && x.code === pre);
        expect(pc, `${c.code} needs ${pre}`).toBeDefined();
        expect(pc!.level, `${c.code} needs ${pre}`).toBeLessThan(c.level);
      }
    }
  });
});
