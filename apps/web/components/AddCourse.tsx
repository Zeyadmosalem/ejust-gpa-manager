"use client";

import { useMemo, useState } from "react";
import { CATALOG, courseStatuses, type CatalogEntry } from "@/lib/derive";
import { newId, updateSemester, useData } from "@/lib/store";

export function AddCourse({ semId, taken, onClose }: { semId: string; taken: string[]; onClose: () => void }) {
  const data = useData();
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cCode, setCCode] = useState("");
  const [cCredits, setCCredits] = useState("3");
  const statuses = useMemo(() => courseStatuses(data.semesters), [data.semesters]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/\s+/g, "");
    const out = new Map<string, CatalogEntry[]>();
    for (const c of CATALOG) {
      if (taken.includes(c.code)) continue;
      if (needle && !(c.code.toLowerCase().includes(needle) || c.title.toLowerCase().replace(/\s+/g, "").includes(needle))) continue;
      const list = out.get(c.group) ?? [];
      list.push(c);
      out.set(c.group, list);
    }
    return [...out.entries()];
  }, [q, taken]);

  function add(c: CatalogEntry) {
    updateSemester(semId, (s) => ({
      ...s,
      courses: [
        ...s.courses,
        { id: newId(), code: c.code, title: c.title, credits: c.credits, weights: c.weights, gradeScale: c.gradeScale, marks: {} },
      ],
    }));
    onClose();
  }

  function addCustom(e: React.FormEvent) {
    e.preventDefault();
    const credits = Number(cCredits);
    if (!cTitle.trim() || !(credits > 0)) return;
    updateSemester(semId, (s) => ({
      ...s,
      courses: [
        ...s.courses,
        {
          id: newId(),
          code: cCode.trim().toUpperCase().replace(/\s+/g, "") || `CUSTOM-${s.courses.length + 1}`,
          title: cTitle.trim(),
          credits,
          weights: { class: 0.15, midterm: 0.3, lab: 0.15, final: 0.4 },
          marks: {},
        },
      ],
    }));
    onClose();
  }

  return (
    <div className="dialog" role="dialog" aria-modal="true" aria-label="Add course" onClick={onClose}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <div className="spread" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Add course</h2>
            <button className="ghost" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          {custom ? (
            <button className="ghost small" onClick={() => setCustom(false)}>
              ← Back to the study plan
            </button>
          ) : (
            <input autoFocus placeholder="Search by code or name, e.g. CSC 211" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
          )}
        </div>
        <div className="dialog-body">
          {custom ? (
            <form onSubmit={addCustom} style={{ padding: "8px 16px", display: "grid", gap: 10 }}>
              <label>
                Course name
                <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} required />
              </label>
              <div className="field-grid">
                <label>
                  Code
                  <input value={cCode} onChange={(e) => setCCode(e.target.value)} placeholder="Optional" />
                </label>
                <label>
                  Credits
                  <input type="number" min={1} max={20} value={cCredits} onChange={(e) => setCCredits(e.target.value)} />
                </label>
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                Uses the usual split: class 15%, midterm 30%, lab 15%, final 40%.
              </p>
              <button className="primary" type="submit">
                Add
              </button>
            </form>
          ) : (
            <>
              {groups.length === 0 && <p className="empty">No matching courses.</p>}
              {groups.map(([group, list]) => (
                <div key={group}>
                  <div className="group-label">{group}</div>
                  {list.map((c) => {
                    const st = statuses.get(c.code);
                    return (
                      <button key={c.code} className="option" onClick={() => add(c)}>
                        <span>
                          <span className="course-code">{c.code}</span> {c.title}
                        </span>
                        <span className="muted small">
                          {st?.status === "passed" ? `Passed (${st.grade}) · ` : st?.status === "failed" ? "Retake · " : ""}
                          {c.credits} cr
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
              <div style={{ padding: "12px 16px" }}>
                <button onClick={() => setCustom(true)}>Course not listed? Add it manually</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
