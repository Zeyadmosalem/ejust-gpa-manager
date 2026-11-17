"use client";

import Link from "next/link";
import { useState } from "react";
import { cumulativeSummary, fmt, passedCredits, PROGRAM, semesterSummary } from "@/lib/derive";
import { newId, update, useData, useHydrated } from "@/lib/store";

export default function Overview() {
  const data = useData();
  const hydrated = useHydrated();
  const [name, setName] = useState("");

  const cgpa = cumulativeSummary(data.semesters);
  const projected = cumulativeSummary(data.semesters, true);
  const passed = passedCredits(data.semesters);
  const showProjected = projected.gpaHours !== cgpa.gpaHours || projected.qualityPoints !== cgpa.qualityPoints;

  function addSemester(e: React.FormEvent) {
    e.preventDefault();
    const label = name.trim() || `Semester ${data.semesters.length + 1}`;
    update((d) => ({ ...d, semesters: [...d.semesters, { id: newId(), name: label, courses: [] }] }));
    setName("");
  }

  if (!hydrated) return null;

  return (
    <>
      <h1>Overview</h1>
      <p className="sub">{PROGRAM.name} · {PROGRAM.totalCredits} credits</p>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">CGPA</div>
          <div className="stat-value">{fmt(cgpa.gpa)}</div>
          <div className="stat-note">{cgpa.gpaHours} GPA hours</div>
        </div>
        {showProjected && (
          <div className="stat">
            <div className="stat-label">Projected CGPA</div>
            <div className="stat-value">{fmt(projected.gpa)}</div>
            <div className="stat-note">If you get your target grades</div>
          </div>
        )}
        <div className="stat">
          <div className="stat-label">Credits passed</div>
          <div className="stat-value">
            {passed}
            <span className="muted small"> / {PROGRAM.totalCredits}</span>
          </div>
          <div className="bar" aria-hidden>
            <span style={{ width: `${Math.min(100, (passed / PROGRAM.totalCredits) * 100)}%` }} />
          </div>
        </div>
      </div>

      {cgpa.gpa !== null && cgpa.gpa < 2 && (
        <div className="notice">
          A CGPA under 2.00 puts you on academic probation, with a 12-credit limit per semester until it is back to
          2.00.
        </div>
      )}

      <div className="spread" style={{ marginBottom: 8 }}>
        <h2>Semesters</h2>
      </div>

      {data.semesters.length === 0 ? (
        <div className="card empty">
          <p>No semesters yet. Add your first one below, then add courses from the CSC study plan.</p>
        </div>
      ) : (
        <ul className="card list list-card">
          {data.semesters.map((s, i) => {
            const sum = semesterSummary(s);
            const cum = cumulativeSummary(data.semesters.slice(0, i + 1));
            const credits = s.courses.reduce((n, c) => n + c.credits, 0);
            return (
              <li key={s.id}>
                <Link href={`/semester/?id=${s.id}`} className="list-item">
                  <div>
                    <h3>{s.name}</h3>
                    <div className="muted small">
                      {s.courses.length} courses · {credits} credits
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="grade">GPA {fmt(sum.gpa)}</div>
                    <div className="muted small">CGPA {fmt(cum.gpa)}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <form className="card row" onSubmit={addSemester}>
        <input
          aria-label="Semester name"
          placeholder={`e.g. Fall 2026/27`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="primary" type="submit">
          Add semester
        </button>
      </form>
    </>
  );
}
