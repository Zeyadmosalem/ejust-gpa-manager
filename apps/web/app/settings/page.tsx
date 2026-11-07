"use client";

import { useRef, useState } from "react";
import { parseData, replaceAll, useData, useHydrated } from "@/lib/store";

export default function Settings() {
  const data = useData();
  const hydrated = useHydrated();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  if (!hydrated) return null;

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ejust-gpa-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importData(f: File) {
    try {
      const parsed = parseData(JSON.parse(await f.text()));
      if (data.semesters.length && !confirm("Replace everything here with this backup?")) return;
      replaceAll(parsed);
      setMsg(`Imported ${parsed.semesters.length} semesters.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not read that file.");
    }
  }

  function reset() {
    if (confirm("Delete all your semesters and marks from this browser? This can't be undone.")) {
      replaceAll({ version: 1, programId: "csc", semesters: [] });
      setMsg("All data deleted.");
    }
  }

  return (
    <>
      <h1>Your data</h1>
      <p className="sub">
        Everything is saved in this browser only. Nothing is sent to a server. Export a backup to move to another device.
      </p>
      <section className="card row">
        <button className="primary" onClick={exportData}>
          Export backup
        </button>
        <button onClick={() => file.current?.click()}>Import backup</button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importData(f);
            e.target.value = "";
          }}
        />
        <span style={{ flex: 1 }} />
        <button className="danger" onClick={reset}>
          Delete all data
        </button>
      </section>
      {msg && <p role="status">{msg}</p>}
    </>
  );
}
