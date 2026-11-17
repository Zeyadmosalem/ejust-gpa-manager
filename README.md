# E-JUST GPA Manager

A free web service that helps students at the Egypt-Japan University of Science and Technology (E-JUST) track their grades, plan their degree, and see what they need to hit a target GPA.

> **Status:** MVP (M2) in progress. The web app is in `apps/web`, the GPA engine in `packages/engine` and the CSC study plan in `data/programs/csc.json`.
>
> ```
> npm install
> npm run dev     # http://localhost:3000
> npm test        # engine tests
> npm run build   # static site in apps/web/out
> ```

This is an independent student project. It is not affiliated with or endorsed by E-JUST.

---

## 1. Why

E-JUST students juggle weighted assessments (class work, midterm, lab, oral, final), program-specific study plans, elective pools, and prerequisites. Generic GPA calculators don't know any of that. This service will:

- Know each program's study plan out of the box (starting with **CSC, 134 credits, 8 levels**).
- Compute course marks from the official component weights, not just letter grades.
- Answer the question students actually ask: *"What do I need on the final to get an A?"* and *"What GPA do I need from now on to graduate with X?"*

## 2. Features

### MVP (v0.1)
| Feature | Notes |
|---|---|
| Program catalog | Pick a program (CSC first). Courses, credits, levels, prerequisites and grading weights load automatically. |
| Semesters | Add semesters, add courses from the catalog or as custom entries. |
| Component marks | Enter Class / Midterm / Lab / Oral / Final marks. Course total uses the course's weights (e.g. 0.15 / 0.3 / 0.15 / 0.4). |
| GPA & CGPA | Semester GPA and cumulative GPA, using the E-JUST grade scale (stored as config, not hard-coded). |
| Target mode | "I want an A in CSC 211": shows the minimum final mark needed given marks so far. |
| What-if | Try hypothetical grades for current/future courses without saving them. |
| Local-first | Works with no account. Data stays in the browser (IndexedDB). Export/import as JSON. |

### v0.2: Accounts and sync
- Optional sign-in (email magic link or Google). Data syncs across devices.
- Import from a Semester Ledger / v0.1 JSON export.

### v0.3: Degree planning
- Degree progress: credits done per level and per category (University Requirements, Basic Science, Basic Computing, Program Electives, Graduation Project, Field Training).
- Prerequisite checker: flags a course planned before its prerequisite (e.g. CSC 221 needs CSE 214).
- Elective pickers driven by the elective tables (Tables 3, 5, 7, 9 in the CSC plan).
- Graduation projection: "If I keep my current average, I graduate with X."
- Standing alerts from the handbook: probation below a 2.00 CGPA (12-credit cap), scholarship thresholds (3.0, 2.4 for sports) and tuition discounts (3.7 and 3.85).

### Later
- More programs (other E-JUST schools), contributed as data files.
- Transcript import from a screenshot/PDF (parsed in the browser, never uploaded unless the user opts in).
- PWA install for phones and offline use.
- Arabic UI and RTL support.
- Shareable, anonymized "study plan" links (no grades).

## 3. Data model

```
Program      id, name, totalCredits, gradeScale, levels[]
Course       code, title, credits, level, category, prerequisites[],
             weights { class, midterm, lab, oral, final }, examHours
Student      id, programId, settings
Semester     id, studentId, term (Fall/Spring/Summer), year, level
Enrollment   semesterId, courseCode, marks { class, midterm, lab, oral, final },
             target, status (planned | in-progress | done), override grade
```

Program catalogs live as versioned JSON in `data/programs/` (for example `csc-2024.json`), so a study plan change is a pull request, not a code change. One credit hour = 100 marks, as stated in the study plan.

## 4. Architecture

```
Browser (Next.js app, React, TypeScript)
  ├─ GPA engine (pure TS package, unit tested)
  ├─ Local store (IndexedDB via Dexie)   ← default, works offline
  └─ Sync client ───────────────► API (Next.js route handlers)
                                     └─ Postgres (Supabase or Neon)
```

- **Frontend:** Next.js + TypeScript + Tailwind. Mobile-first, since most students will use it on their phones.
- **GPA engine:** a standalone `packages/engine` with no UI dependencies. All grade math lives here and is covered by tests against real worked examples.
- **Backend (v0.2+):** Next.js API routes. Postgres with row-level security, so each user can only read their own rows.
- **Auth (v0.2+):** Supabase Auth or Auth.js, magic link + Google.
- **Hosting:** Vercel (frontend + API) and Supabase/Neon free tier. Cost should be $0 until real usage.
- **CI:** GitHub Actions running lint, type check, engine tests and catalog JSON schema validation on every PR.

## 5. Privacy and security

Grades are personal data, so the defaults are conservative:

- **No account needed.** Without sign-in, nothing leaves the device.
- **Minimal data.** No student ID, national ID, or real name required. An email is the only identifier when syncing.
- **User owns the data.** One-click export and one-click delete of the account and all its data.
- **No analytics on grades.** Only aggregate, anonymous usage counts (page views), if any.
- **No real transcripts in this repo.** Test fixtures use made-up students. Personal data files are git-ignored.
- **Unofficial results.** The app shows a clear note that its numbers are estimates and the official transcript is the source of truth.

## 6. Roadmap

| Milestone | Scope | Done when |
|---|---|---|
| M0: Foundations | Repo setup, CI, CSC catalog JSON + schema, grade-scale config | Catalog validates in CI |
| M1: Engine | Course total, letter grade, GPA, CGPA, required-final calculator | Tests pass against hand-checked examples |
| M2: MVP app | Semesters, marks entry, target, what-if, local storage, export/import | A student can track a full semester offline |
| M3: Launch | Deploy to Vercel, landing page, feedback form | Shared with a few CSC classmates |
| M4: Sync | Auth, Postgres, sync, account delete | Same data on phone and laptop |
| M5: Degree planner | Progress by category, prerequisites, electives, projection | CSC student can plan all 8 levels |
| M6: More programs | Contributor guide for adding a program's catalog | 2+ programs beyond CSC |

## 7. Open questions

1. ~~**Grade scale**~~: resolved from the CSIT Student Handbook (2024). CSIT courses pass at 60% and University Requirements/Liberal Arts at 50%. F and WF count as 1.0, W/FW/I don't count, and the most recent attempt of a repeated course counts in CGPA.
2. **Scope:** CSC only at launch, or other programs from day one?
3. **Accounts:** is local-only enough for launch, or is sync a must-have?
4. **Name and domain:** keep "E-JUST GPA Manager", or pick something shorter?

## 8. Contributing

Once M0 lands: open an issue for bugs or a missing program. Program catalogs are plain JSON, so you can help without writing code.

## License

MIT (proposed).
