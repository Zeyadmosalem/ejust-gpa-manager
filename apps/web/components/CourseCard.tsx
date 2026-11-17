"use client";

import { requiredMarksByLetter, letterFor, type Component } from "@ejust-gpa/engine";
import {
  COMPONENT_LABELS,
  components,
  finalGrade,
  fmt,
  hasAnyMarks,
  LETTERS,
  OTHER_GRADES,
  scaleOf,
  totalPercent,
} from "@/lib/derive";
import { type Enrollment, updateCourse, updateSemester } from "@/lib/store";

function gradeTone(g: string | null): string {
  if (!g) return "";
  if (g === "F" || g === "WF") return "bad";
  if (g === "W" || g === "FW" || g === "I") return "warn";
  return "good";
}

export function CourseCard({ semId, course }: { semId: string; course: Enrollment }) {
  const comps = components(course.weights);
  const scale = scaleOf(course);
  const grade = finalGrade(course);
  const total = totalPercent(course);
  const set = (fn: (c: Enrollment) => Enrollment) => updateCourse(semId, course.id, fn);

  function setMark(c: Component, raw: string) {
    set((e) => {
      const marks = { ...e.marks };
      if (raw === "") delete marks[c];
      else marks[c] = Math.max(0, Math.min(100, Number(raw)));
      return { ...e, marks };
    });
  }

  function remove() {
    updateSemester(semId, (s) => ({ ...s, courses: s.courses.filter((c) => c.id !== course.id) }));
  }

  // Which component is still missing? Show what's needed on it (usually the final).
  const missing = comps.filter((c) => typeof course.marks[c] !== "number");
  const solveFor: Component | null = missing.length === 1 ? missing[0]! : missing.includes("final") ? "final" : null;
  const needed =
    !course.grade && solveFor && hasAnyMarks(course)
      ? requiredMarksByLetter(
          Object.fromEntries(Object.entries(course.marks).filter(([k]) => k !== solveFor)),
          course.weights,
          scale,
          solveFor,
        ).filter((r) => r.letter !== "F")
      : null;
  const extraMissing = solveFor ? missing.filter((c) => c !== solveFor) : [];

  return (
    <article className="card">
      <div className="course-head">
        <div>
          <div className="course-code">
            {course.code} · {course.credits} credits
          </div>
          <h3>{course.title}</h3>
        </div>
        <div className="row">
          {grade ? (
            <span className={`pill ${gradeTone(grade)}`}>{grade}</span>
          ) : (
            <span className="pill">In progress</span>
          )}
        </div>
      </div>

      {!course.grade && (
        <>
          <div className="field-grid" style={{ marginTop: 12 }}>
            {comps.map((c) => (
              <label key={c}>
                {COMPONENT_LABELS[c]} · {Math.round((course.weights[c] ?? 0) * 100)}%
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="any"
                  placeholder="%"
                  value={course.marks[c] ?? ""}
                  onChange={(e) => setMark(c, e.target.value)}
                />
              </label>
            ))}
          </div>
          <p className="small muted" style={{ margin: "8px 0 0" }}>
            Enter each mark as a percentage of that part.{" "}
            {hasAnyMarks(course) && (
              <>
                So far: <b>{fmt(total, 1)}%</b>
                {grade ? "" : ` of the course (${letterFor(total, scale).letter} if nothing else is added)`}
              </>
            )}
          </p>
        </>
      )}

      {needed && (
        <div style={{ marginTop: 12 }}>
          <div className="small muted">
            Needed on the {COMPONENT_LABELS[solveFor!].toLowerCase()} for each grade
            {extraMissing.length > 0 && ` (assuming 0 on ${extraMissing.map((c) => COMPONENT_LABELS[c].toLowerCase()).join(", ")})`}
          </div>
          <div className="req-grid">
            {needed.map((r) => (
              <div key={r.letter} className={`req${r.required === null ? " off" : ""}${course.target === r.letter ? " hit" : ""}`}>
                <b>{r.letter}</b>
                <span>{r.required === null ? "Out of reach" : r.required === 0 ? "Secured" : `${fmt(r.required, 1)}%`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        {!grade && (
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Target
            <select value={course.target ?? ""} onChange={(e) => set((c) => ({ ...c, target: e.target.value || undefined }))}>
              <option value="">–</option>
              {LETTERS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Official grade
          <select value={course.grade ?? ""} onChange={(e) => set((c) => ({ ...c, grade: e.target.value || undefined }))}>
            <option value="">From marks</option>
            {[...LETTERS, ...OTHER_GRADES].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <span style={{ flex: 1 }} />
        <button className="ghost danger small" onClick={remove}>
          Remove
        </button>
      </div>
    </article>
  );
}
