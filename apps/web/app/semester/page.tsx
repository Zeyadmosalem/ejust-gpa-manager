"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AddCourse } from "@/components/AddCourse";
import { CourseCard } from "@/components/CourseCard";
import { cumulativeSummary, fmt, semesterSummary } from "@/lib/derive";
import { update, updateSemester, useData, useHydrated } from "@/lib/store";

function SemesterView() {
  const id = useSearchParams().get("id");
  const data = useData();
  const hydrated = useHydrated();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  if (!hydrated) return null;
  const idx = data.semesters.findIndex((s) => s.id === id);
  const sem = data.semesters[idx];
  if (!sem) {
    return (
      <div className="card empty">
        <p>This semester doesn&apos;t exist anymore.</p>
        <Link className="btn" href="/">
          Back to overview
        </Link>
      </div>
    );
  }

  const gpa = semesterSummary(sem);
  const proj = semesterSummary(sem, true);
  const cum = cumulativeSummary(data.semesters.slice(0, idx + 1));
  const projCum = cumulativeSummary(data.semesters.slice(0, idx + 1), true);
  const credits = sem.courses.reduce((n, c) => n + c.credits, 0);
  const prevCgpa = cumulativeSummary(data.semesters.slice(0, idx)).gpa;

  function remove() {
    if (!confirm(`Delete ${sem!.name} and all its courses?`)) return;
    update((d) => ({ ...d, semesters: d.semesters.filter((s) => s.id !== sem!.id) }));
    router.push("/");
  }

  return (
    <>
      <Link href="/" className="muted small">
        ← Overview
      </Link>
      <div className="spread" style={{ margin: "6px 0 12px" }}>
        <input
          aria-label="Semester name"
          value={sem.name}
          onChange={(e) => updateSemester(sem.id, (s) => ({ ...s, name: e.target.value }))}
          style={{ fontSize: 22, fontWeight: 700, border: 0, padding: 0, background: "transparent", flex: 1 }}
        />
        <button className="danger ghost" onClick={remove}>
          Delete semester
        </button>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Semester GPA</div>
          <div className="stat-value">{fmt(gpa.gpa)}</div>
          <div className="stat-note">{credits} credits registered</div>
        </div>
        <div className="stat">
          <div className="stat-label">CGPA after this semester</div>
          <div className="stat-value">{fmt(cum.gpa)}</div>
        </div>
        {proj.gpaHours !== gpa.gpaHours && (
          <div className="stat">
            <div className="stat-label">With your targets</div>
            <div className="stat-value">{fmt(proj.gpa)}</div>
            <div className="stat-note">CGPA {fmt(projCum.gpa)}</div>
          </div>
        )}
      </div>

      {prevCgpa !== null && prevCgpa < 2 && credits > 12 && (
          <div className="notice">You were under 2.00 CGPA going into this semester, so the limit is 12 credits.</div>
        )}

      {sem.courses.length === 0 && (
        <div className="card empty">
          <p>No courses yet.</p>
        </div>
      )}
      {sem.courses.map((c) => (
        <CourseCard key={c.id} semId={sem.id} course={c} />
      ))}

      <button className="primary" onClick={() => setAdding(true)}>
        + Add course
      </button>
      {adding && <AddCourse semId={sem.id} taken={sem.courses.map((c) => c.code)} onClose={() => setAdding(false)} />}
    </>
  );
}

export default function SemesterPage() {
  return (
    <Suspense fallback={null}>
      <SemesterView />
    </Suspense>
  );
}
