"use client";

import { useEffect, useState } from "react";
import { Search, Check } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useClassesAndSections } from "@/lib/use-classes-sections";

const sessions = ["2025-26", "2026-27"];

export default function PromoteStudentsPage() {
  const { data: students } = useApi<any>("/api/academics/promote-student")
  const { classes, sectionsOf } = useClassesAndSections();
  const [filters, setFilters] = useState({
    fromClass: 0,
    fromSection: "",
    toClass: 0,
    toSection: "",
    session: "2026-27",
  });
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (classes.length === 0 || filters.fromClass !== 0) return;
    const from = classes[0];
    const to = classes[1] || classes[0];
    const fromSections = sectionsOf(from.id);
    const toSections = sectionsOf(to.id);
    setFilters((prev) => ({
      ...prev,
      fromClass: from.id,
      toClass: to.id,
      fromSection: fromSections[0]?.name ?? "",
      toSection: toSections[0]?.name ?? "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  const fromSections = sectionsOf(filters.fromClass);
  const toSections = sectionsOf(filters.toClass);
  const classLabel = (id: number) => classes.find((c) => c.id === id)?.name ?? "";

  const handleSearch = () => {
    setSearched(true);
    setSelected([]);
    setSuccess("");
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === (students || []).length) {
      setSelected([]);
    } else {
      setSelected((students || []).map((s: any) => s.id));
    }
  };

  const handlePromote = () => {
    if (selected.length === 0) return;
    setSuccess(
      `${selected.length} student(s) successfully promoted from ${classLabel(filters.fromClass)} ${filters.fromSection} to ${classLabel(filters.toClass)} ${filters.toSection} for session ${filters.session}`
    );
    setSelected([]);
    setSearched(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Promote Students</h1>
        <p className="mt-1 text-sm text-white/80">Promote students to the next class</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">From Class</label>
            <select
              value={filters.fromClass}
              onChange={(e) => {
                const classId = Number(e.target.value);
                setFilters({ ...filters, fromClass: classId, fromSection: sectionsOf(classId)[0]?.name ?? "" });
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">From Section</label>
            <select
              value={filters.fromSection}
              onChange={(e) => setFilters({ ...filters, fromSection: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {fromSections.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">To Class</label>
            <select
              value={filters.toClass}
              onChange={(e) => {
                const classId = Number(e.target.value);
                setFilters({ ...filters, toClass: classId, toSection: sectionsOf(classId)[0]?.name ?? "" });
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">To Section</label>
            <select
              value={filters.toSection}
              onChange={(e) => setFilters({ ...filters, toSection: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {toSections.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Session</label>
            <select
              value={filters.session}
              onChange={(e) => setFilters({ ...filters, session: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            >
              {sessions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            Search Students
          </button>
        </div>
      </div>

      {searched && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.length === (students || []).length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">#</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Admission No</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Name</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--title-color)]">Roll No</th>
              </tr>
            </thead>
            <tbody>
              {(students || []).map((student: any, idx: number) => (
                <tr
                  key={student.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{idx + 1}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{student.admissionNo}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{student.name}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{student.rollNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <span className="text-sm text-[var(--subtitle-color)]">
              {selected.length} of {(students || []).length} selected
            </span>
            <button
              onClick={handlePromote}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Promote Selected
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="mr-2 inline h-4 w-4" />
          {success}
        </div>
      )}
    </div>
  );
}
