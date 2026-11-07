"use client";

import { useSyncExternalStore } from "react";
import type { Marks, Weights } from "@ejust-gpa/engine";

export interface Enrollment {
  id: string;
  code: string;
  title: string;
  credits: number;
  weights: Weights;
  gradeScale?: string;
  /** Component marks as percentages (0-100). */
  marks: Marks;
  /** A grade entered directly (e.g. from a transcript). Overrides marks. */
  grade?: string;
  /** Expected or wanted letter, used for what-if and required final mark. */
  target?: string;
}

export interface SemesterRecord {
  id: string;
  name: string;
  courses: Enrollment[];
}

export interface AppData {
  version: 1;
  programId: "csc";
  semesters: SemesterRecord[];
  targetCgpa?: number;
}

const KEY = "ejust-gpa-manager:v1";
const EMPTY: AppData = { version: 1, programId: "csc", semesters: [] };

let state: AppData = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load(): AppData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return parseData(JSON.parse(raw));
  } catch {
    /* storage blocked or corrupt: start empty */
  }
  return EMPTY;
}

export function parseData(x: unknown): AppData {
  const d = x as Partial<AppData> | null;
  if (!d || d.version !== 1 || !Array.isArray(d.semesters)) {
    throw new Error("This file is not an E-JUST GPA Manager backup.");
  }
  return { ...EMPTY, ...d } as AppData;
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    state = load();
    loaded = true;
  }
}

function subscribe(fn: () => void) {
  ensureLoaded();
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useData(): AppData {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return state;
    },
    () => EMPTY,
  );
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function update(fn: (d: AppData) => AppData) {
  ensureLoaded();
  state = fn(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}

export function replaceAll(d: AppData) {
  update(() => d);
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function updateSemester(id: string, fn: (s: SemesterRecord) => SemesterRecord) {
  update((d) => ({ ...d, semesters: d.semesters.map((s) => (s.id === id ? fn(s) : s)) }));
}

export function updateCourse(semId: string, courseId: string, fn: (c: Enrollment) => Enrollment) {
  updateSemester(semId, (s) => ({ ...s, courses: s.courses.map((c) => (c.id === courseId ? fn(c) : c)) }));
}
