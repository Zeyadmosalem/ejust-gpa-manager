import { describe, expect, it } from "vitest";
import { assertWeights, CSC_PROGRAM, GRADE_SCALES, isSlot, scaleFor } from "../src";

describe.each(Object.values(GRADE_SCALES))("grade scale $id", (scale) => {
  it("has unique letters and descending cutoffs", () => {
    const letters = scale.grades.map((g) => g.letter);
    expect(new Set(letters).size).toBe(letters.length);
    const cut = scale.grades.map((g) => g.minPercent);
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

describe("CSC elective tables", () => {
  const tables = Object.entries(CSC_PROGRAM.electives);
  it("covers every elective slot in the plan", () => {
    for (const c of CSC_PROGRAM.courses) {
      if (isSlot(c)) expect(CSC_PROGRAM.electives[c.electiveTable], c.title).toBeDefined();
    }
  });
  it("has enough slot credits for each table", () => {
    for (const [name, t] of tables) {
      const slots = CSC_PROGRAM.courses.filter((c) => isSlot(c) && c.electiveTable === name);
      expect(slots.reduce((s, c) => s + c.credits, 0), name).toBe(t.requiredCredits);
    }
  });
  it("has valid weights and grade scales", () => {
    for (const [, t] of tables) {
      for (const c of t.courses) {
        expect(() => assertWeights(c.weights), c.code).not.toThrow();
        expect(() => scaleFor(c, CSC_PROGRAM), c.code).not.toThrow();
      }
    }
  });
});
