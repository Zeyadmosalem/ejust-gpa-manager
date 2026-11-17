"use client";

import { isSlot } from "@ejust-gpa/engine";
import { courseStatuses, PROGRAM, type CourseStatus } from "@/lib/derive";
import { useData, useHydrated } from "@/lib/store";

const LABEL: Record<CourseStatus | "todo", [string, string]> = {
  passed: ["Passed", "good"],
  failed: ["Retake needed", "bad"],
  "in-progress": ["In progress", "warn"],
  withdrawn: ["Withdrawn", "warn"],
  todo: ["Not taken", ""],
};

export default function Plan() {
  const data = useData();
  const hydrated = useHydrated();
  if (!hydrated) return null;

  const statuses = courseStatuses(data.semesters);

  // Fill elective slots with electives the student has taken from that table, best status first.
  const order: CourseStatus[] = ["passed", "in-progress", "failed", "withdrawn"];
  const pools = new Map<string, { code: string; title: string; status: CourseStatus; grade?: string }[]>();
  for (const [table, t] of Object.entries(PROGRAM.electives)) {
    const taken = t.courses
      .filter((c) => statuses.has(c.code))
      .map((c) => ({ code: c.code, title: c.title, ...statuses.get(c.code)! }))
      .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    pools.set(table, taken);
  }

  const levels = Object.keys(PROGRAM.levelCredits).map(Number);
  let totalPassed = 0;

  const rendered = levels.map((lvl) => {
    const rows = PROGRAM.courses
      .filter((c) => c.level === lvl)
      .map((c, i) => {
        if (isSlot(c)) {
          const pick = pools.get(c.electiveTable)?.shift();
          const st: CourseStatus | "todo" = pick?.status ?? "todo";
          return { key: `${lvl}-${i}`, code: pick?.code ?? "Elective", title: pick ? pick.title : c.title, sub: pick ? c.title : c.electiveTable, credits: c.credits, st, grade: pick?.grade };
        }
        const s = statuses.get(c.code);
        return { key: c.code, code: c.code, title: c.title, sub: c.prerequisites.length ? `Needs ${c.prerequisites.join(", ")}` : "", credits: c.credits, st: (s?.status ?? "todo") as CourseStatus | "todo", grade: s?.grade };
      });
    const passed = rows.filter((r) => r.st === "passed").reduce((n, r) => n + r.credits, 0);
    totalPassed += passed;
    return { lvl, rows, passed };
  });

  return (
    <>
      <h1>Degree plan</h1>
      <p className="sub">
        {PROGRAM.name}: {totalPassed} of {PROGRAM.totalCredits} credits passed. Electives you take fill the matching slots
        automatically.
      </p>
      {rendered.map(({ lvl, rows, passed }) => (
        <section key={lvl} className="card list-card" style={{ marginBottom: 12 }}>
          <div className="spread" style={{ padding: "12px 16px" }}>
            <h2 style={{ margin: 0 }}>Level {lvl}</h2>
            <span className="muted small">
              {passed} / {PROGRAM.levelCredits[String(lvl)]} credits
            </span>
          </div>
          <ul className="list">
            {rows.map((r) => {
              const [label, tone] = LABEL[r.st];
              return (
                <li key={r.key} className="list-item" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <div className="course-code">
                      {r.code} · {r.credits} cr
                    </div>
                    <div>{r.title}</div>
                    {r.sub && <div className="muted small">{r.sub}</div>}
                  </div>
                  <span className={`pill ${tone}`}>
                    {label}
                    {r.grade && r.st !== "in-progress" ? ` · ${r.grade}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
