"use client";

import { requiredFutureGpa, EJUST_LIBERAL_ARTS_SCALE } from "@ejust-gpa/engine";
import { cumulativeSummary, fmt, GPA_SCALE, passedCredits, PROGRAM } from "@/lib/derive";
import { update, useData, useHydrated } from "@/lib/store";

const MILESTONES = [
  { cgpa: 2.0, label: "Good standing (no probation)" },
  { cgpa: 2.4, label: "Keep a sports scholarship" },
  { cgpa: 3.0, label: "Keep an excellence or government scholarship" },
  { cgpa: 3.7, label: "20% tuition discount next year" },
  { cgpa: 3.85, label: "40% tuition discount next year" },
];

export default function Tools() {
  const data = useData();
  const hydrated = useHydrated();
  if (!hydrated) return null;

  const now = cumulativeSummary(data.semesters);
  const remaining = Math.max(0, PROGRAM.totalCredits - passedCredits(data.semesters));
  const target = data.targetCgpa ?? 3.0;
  const need = remaining > 0 ? requiredFutureGpa(now, remaining, target, GPA_SCALE) : null;

  return (
    <>
      <h1>Targets</h1>
      <p className="sub">What you need from here on to reach a CGPA.</p>

      <section className="card">
        <h2>Target CGPA</h2>
        <div className="field-grid" style={{ maxWidth: 360 }}>
          <label>
            Target
            <input
              type="number"
              step="0.01"
              min={1}
              max={4}
              value={target}
              onChange={(e) => update((d) => ({ ...d, targetCgpa: e.target.value === "" ? undefined : Number(e.target.value) }))}
            />
          </label>
          <label>
            Credits left
            <input type="number" value={remaining} readOnly />
          </label>
        </div>
        <p style={{ marginBottom: 0 }}>
          {now.gpa === null ? (
            <span className="muted">Add some graded courses first.</span>
          ) : remaining === 0 ? (
            <span className="muted">You have passed all {PROGRAM.totalCredits} credits.</span>
          ) : need === null ? (
            <>
              Reaching <b>{fmt(target)}</b> isn&apos;t possible in the {remaining} credits left, even with straight A+.
            </>
          ) : (
            <>
              You need an average of <b className="grade">{fmt(need)}</b> over your remaining {remaining} credits to finish
              at {fmt(target)}. Your CGPA is {fmt(now.gpa)} now.
            </>
          )}
        </p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          This assumes the remaining credits are new courses. Retaking a failed course replaces its old grade, which
          helps more than a new course.
        </p>
      </section>

      <section className="card">
        <h2>Milestones</h2>
        <ul className="list">
          {MILESTONES.map((m) => {
            const ok = now.gpa !== null && now.gpa >= m.cgpa;
            return (
              <li key={m.cgpa} className="list-item" style={{ padding: "8px 0" }}>
                <span>
                  <b>{m.cgpa.toFixed(2)}</b> <span className="muted">· {m.label}</span>
                </span>
                <span className={`pill ${ok ? "good" : ""}`}>{ok ? "Met" : "Not yet"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <h2>Grading scale</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Points</th>
                <th>CSIT courses</th>
                <th>LRA courses</th>
              </tr>
            </thead>
            <tbody>
              {GPA_SCALE.grades.map((g, i) => (
                <tr key={g.letter}>
                  <td className="grade">{g.letter}</td>
                  <td>{g.points.toFixed(2)}</td>
                  <td>{g.minPercent > 0 ? `${g.minPercent}%+` : `< ${GPA_SCALE.grades[i - 1]?.minPercent}%`}</td>
                  <td>
                    {EJUST_LIBERAL_ARTS_SCALE.grades[i]!.minPercent > 0
                      ? `${EJUST_LIBERAL_ARTS_SCALE.grades[i]!.minPercent}%+`
                      : `< ${EJUST_LIBERAL_ARTS_SCALE.grades[i - 1]?.minPercent}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          WF counts as 1.00 like F. W, FW and I don&apos;t count. A repeated course only counts its latest grade.
        </p>
      </section>
    </>
  );
}
